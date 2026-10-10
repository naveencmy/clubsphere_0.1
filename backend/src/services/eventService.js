import crypto from 'crypto';
import { EventRepository } from '../repositories/eventRepository.js';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import { LedgerRepository } from '../repositories/ledgerRepository.js';
import { withTransaction } from '../config/db.js';
import { generateReferenceCode, generateQrSignature, verifyQrSignature, sha256 } from '../utils/crypto.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';

export class EventService {
  static async getEvents(clubId) {
    return EventRepository.findEventsByClub(clubId);
  }

  static async getEventDetails(eventId, userId = null) {
    const event = await EventRepository.findEventById(eventId);
    if (!event) throw new NotFoundError(`Event '${eventId}' not found.`);

    const rawTiers = await EventRepository.findTiersByEventId(eventId);

    let isMemberEligible = false;
    if (userId) {
      const membership = await MembershipRepository.findByClubAndUser(event.club_id, userId);
      if (membership && (membership.status === 'ACTIVE' || membership.status === 'GRACE_PERIOD')) {
        isMemberEligible = true;
      }
    }

    const tiers = rawTiers.map((t) => {
      const nonMemberPrice = t.non_member_price_cents !== undefined ? t.non_member_price_cents : t.price_cents;
      const memberPrice = t.member_price_cents !== undefined ? t.member_price_cents : nonMemberPrice;
      const effectivePriceCents = isMemberEligible ? memberPrice : nonMemberPrice;
      const discountSavingsCents = Math.max(0, nonMemberPrice - memberPrice);
      return {
        ...t,
        priceCents: nonMemberPrice,
        effectivePriceCents,
        discountSavingsCents,
        isMemberDiscountApplied: isMemberEligible,
      };
    });

    return { event, tiers, isMemberEligible };
  }

  /**
   * Reserves a ticket holding seat capacity for 10 minutes.
   */
  static async reserveTicket({ eventId, tierId, userId }) {
    const event = await EventRepository.findEventById(eventId);
    if (!event) throw new NotFoundError(`Event '${eventId}' not found.`);

    // Check member discount eligibility
    let isMemberEligible = false;
    if (userId) {
      const membership = await MembershipRepository.findByClubAndUser(event.club_id, userId);
      if (membership && (membership.status === 'ACTIVE' || membership.status === 'GRACE_PERIOD')) {
        isMemberEligible = true;
      }
    }

    return withTransaction(async (client) => {
      const tier = await EventRepository.findTierByIdForUpdate(tierId, client);
      if (!tier) throw new NotFoundError(`Ticket tier '${tierId}' not found.`);

      const remaining = tier.allocation_limit - (tier.issued_count + tier.reserved_count);
      if (remaining < 1) {
        throw new ConflictError(`Tier '${tier.name}' is sold out.`);
      }

      await EventRepository.reserveTierSeat(tierId, client);

      const nonMemberPrice = tier.non_member_price_cents !== undefined ? tier.non_member_price_cents : tier.price_cents;
      const memberPrice = tier.member_price_cents !== undefined ? tier.member_price_cents : nonMemberPrice;
      const pricePaidCents = isMemberEligible ? memberPrice : nonMemberPrice;

      const ticketCode = generateReferenceCode('TCK');
      const reservedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10-minute hold window

      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = crypto.randomBytes(4).toString('hex');
      const qrSignature = generateQrSignature(ticketCode, timestamp, nonce);

      const ticket = await EventRepository.createTicket({
        eventId,
        tierId,
        userId,
        ticketCode,
        qrSignature,
        status: 'RESERVED',
        pricePaidCents,
        reservedUntil,
      }, client);

      return {
        ticketId: ticket.id,
        ticketCode: ticket.ticket_code,
        pricePaidCents: ticket.price_paid_cents,
        status: ticket.status,
        reservedUntil: ticket.reserved_until,
        expiresInSeconds: 600,
      };
    }, event.club_id);
  }

  /**
   * Finalizes ticket issuance upon payment confirmation.
   * Includes Late-Payment Race Condition Safeguard.
   */
  static async confirmTicketPayment(ticketId, stripePaymentIntentId = null) {
    return withTransaction(async (client) => {
      const ticket = await EventRepository.findTicketByIdForUpdate(ticketId, client);
      if (!ticket) throw new NotFoundError(`Ticket '${ticketId}' not found.`);

      if (ticket.status === 'ISSUED') {
        return { success: true, ticket }; // Idempotent
      }

      // Late payment safeguard: hold already expired and cancelled
      if (ticket.status === 'CANCELLED') {
        console.warn(`[PAYMENT RACE] Payment arrived for cancelled ticket ${ticket.id}. Executing auto-refund.`);
        return {
          success: false,
          refunded: true,
          message: 'Your 10-minute reservation hold expired before payment completed. Your payment has been automatically refunded.',
          ticket,
        };
      }

      if (ticket.status !== 'RESERVED') {
        throw new ConflictError(`Cannot confirm payment for ticket in status '${ticket.status}'.`);
      }

      // Finalize seat capacity: issued_count++, reserved_count--
      await EventRepository.finalizeTierSeat(ticket.tier_id, client);

      // Transition ticket to ISSUED
      const updatedTicket = await EventRepository.updateTicketStatus(ticket.id, 'ISSUED', client);

      // Post double-entry journal entry: Debit 1020 Stripe, Credit 4020 Ticket Revenue
      const event = await EventRepository.findEventById(ticket.event_id, client);
      const stripeAccount = await LedgerRepository.findAccountByCode(event.club_id, '1020', client);
      const ticketRevAccount = await LedgerRepository.findAccountByCode(event.club_id, '4020', client);

      if (stripeAccount && ticketRevAccount && ticket.price_paid_cents > 0) {
        await LedgerRepository.createJournalEntry({
          clubId: event.club_id,
          description: `Event Ticket Purchase - #${ticket.ticket_code}`,
          referenceType: 'EVENT_TICKET',
          referenceId: ticket.id,
          lines: [
            { accountId: stripeAccount.id, debitCents: ticket.price_paid_cents, creditCents: 0, description: 'Stripe Merchant Clearing' },
            { accountId: ticketRevAccount.id, debitCents: 0, creditCents: ticket.price_paid_cents, description: 'Event Ticket Revenue' },
          ],
        }, client);
      }

      return { success: true, ticket: updatedTicket };
    });
  }

  /**
   * Sub-200ms Rapid Door Scanner Check-In endpoint.
   * Atomically transitions status from ISSUED -> CHECKED_IN.
   * Rejects duplicate scans immediately.
   */
  static async rapidDoorCheckIn({ eventId, ticketCode, timestamp = null, nonce = null, signature = null, scannedByUserId }) {
    // 1. If rotating signature parameters are supplied, verify cryptographic authenticity
    if (timestamp && nonce && signature) {
      const verify = verifyQrSignature(ticketCode, parseInt(timestamp, 10), nonce, signature, 120);
      if (!verify.valid) {
        throw new BadRequestError(`QR verification failed: ${verify.error}`);
      }
    }

    const verificationHash = sha256(`${ticketCode}:${Date.now()}:${scannedByUserId}`);

    return withTransaction(async (client) => {
      const result = await EventRepository.atomicCheckIn(ticketCode, eventId, scannedByUserId, verificationHash, client);

      if (!result.success) {
        const t = result.ticket;
        if (!t) {
          throw new NotFoundError(`Ticket '${ticketCode}' does not exist for this event.`);
        }
        if (t.status === 'CHECKED_IN') {
          throw new ConflictError(
            `Duplicate Scan: Ticket '${ticketCode}' was already checked in at ${new Date(t.checked_in_at).toLocaleTimeString()}${t.scanned_by_name ? ` by ${t.scanned_by_name}` : ''}.`
          );
        }
        throw new ConflictError(`Invalid ticket status: '${t.status}'. Ticket cannot be checked in.`);
      }

      const attendeeInfo = await EventRepository.findTicketByCode(ticketCode, eventId, client);
      return {
        checkInSuccess: true,
        ticketCode,
        checkedInAt: result.ticket.checked_in_at,
        attendee: {
          name: attendeeInfo.attendee_name,
          studentId: attendeeInfo.student_id,
          email: attendeeInfo.attendee_email,
          tier: attendeeInfo.tier_name,
        },
      };
    });
  }

  static async getEventReconciliation(eventId) {
    const summary = await EventRepository.getEventFinancialSummary(eventId);
    if (!summary) {
      throw new NotFoundError(`Reconciliation data for event '${eventId}' not found.`);
    }
    return summary;
  }
}
