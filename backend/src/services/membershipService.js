import crypto from 'crypto';
import { MembershipRepository } from '../repositories/membershipRepository.js';
import { ClubRepository } from '../repositories/clubRepository.js';
import { LedgerRepository } from '../repositories/ledgerRepository.js';
import { withTransaction } from '../config/db.js';
import { generateQrSignature, verifyQrSignature } from '../utils/crypto.js';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors.js';

export class MembershipService {
  /**
   * Register or initiate self-service club membership.
   */
  static async registerMembership({ clubId, userId, tier = 'GENERAL', duesPaid = true }) {
    const existing = await MembershipRepository.findByClubAndUser(clubId, userId);
    if (existing && (existing.status === 'ACTIVE' || existing.status === 'GRACE_PERIOD')) {
      throw new ConflictError('User already has an active or grace-period membership in this club.');
    }

    const qrSecretToken = crypto.randomBytes(32).toString('hex');
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1); // 1-year academic term validity

    const status = duesPaid ? 'ACTIVE' : 'PENDING_PAYMENT';

    return withTransaction(async (client) => {
      // Query annual dues amount directly from the club's pure database record
      const club = await ClubRepository.findById(clubId, client);
      const duesCents = club ? (club.annual_dues_cents || 0) : 0;

      let membership;
      if (existing) {
        membership = await MembershipRepository.renewMembership(existing.id, { validUntil, qrSecretToken, duesPaidCents: duesPaid ? duesCents : 0 }, client);
      } else {
        membership = await MembershipRepository.createMembership({
          clubId,
          userId,
          tier,
          status,
          duesPaidCents: duesPaid ? duesCents : 0,
          validUntil,
          qrSecretToken,
        }, client);
      }

      // If dues are collected, post double-entry revenue entry with pure DB dues amount
      if (duesPaid && duesCents > 0) {
        const stripeAccount = await LedgerRepository.findAccountByCode(clubId, '1020', client);
        const duesAccount = await LedgerRepository.findAccountByCode(clubId, '4010', client);

        if (stripeAccount && duesAccount) {
          await LedgerRepository.createJournalEntry({
            clubId,
            description: `Annual Membership Dues Collection - Member ID ${userId}`,
            referenceType: 'MEMBERSHIP_DUES',
            referenceId: membership.id,
            lines: [
              { accountId: stripeAccount.id, debitCents: duesCents, creditCents: 0, description: 'Stripe Clearing - Dues' },
              { accountId: duesAccount.id, debitCents: 0, creditCents: duesCents, description: 'Membership Dues Revenue' },
            ],
          }, client);
        }
      }

      return membership;
    }, clubId);
  }

  /**
   * Generates a 60-second rotating digital QR payload for an active member.
   */
  static async generateRotatingQrPass(clubId, userId) {
    const membership = await MembershipRepository.findByClubAndUser(clubId, userId);
    if (!membership) {
      throw new NotFoundError('No membership found for this user in the specified club.');
    }

    if (membership.status === 'EXPIRED') {
      throw new BadRequestError('Membership is expired. Please renew to access your digital pass.');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(4).toString('hex');
    const signature = generateQrSignature(membership.qr_secret_token, timestamp, nonce);

    return {
      membershipId: membership.id,
      tier: membership.tier,
      status: membership.status,
      validUntil: membership.valid_until,
      qrPayload: {
        token: membership.qr_secret_token,
        timestamp,
        nonce,
        signature,
      },
    };
  }

  /**
   * Verifies member's permanent digital pass at event walk-up doors.
   */
  static async verifyDigitalPass({ clubId, qrSecretToken, timestamp, nonce, signature }) {
    const membership = await MembershipRepository.findByQrToken(clubId, qrSecretToken);
    if (!membership) {
      return { valid: false, error: 'Member not found or counterfeit token' };
    }

    // Verify cryptographic rotation and drift
    const verification = verifyQrSignature(membership.qr_secret_token, timestamp, nonce, signature, 120);
    if (!verification.valid) {
      return verification;
    }

    const isActive = membership.status === 'ACTIVE';
    const isGrace = membership.status === 'GRACE_PERIOD';

    if (!isActive && !isGrace) {
      return {
        valid: false,
        error: `Membership is ${membership.status}. Member privileges revoked.`,
        membership,
      };
    }

    return {
      valid: true,
      membership: {
        id: membership.id,
        fullName: membership.full_name,
        studentId: membership.student_id,
        tier: membership.tier,
        status: membership.status,
        validUntil: membership.valid_until,
        isGracePeriod: isGrace,
      },
    };
  }

  /**
   * Automated Cron Worker: Checks upcoming expirations and applies grace-period transitions.
   */
  static async runExpirationCheck() {
    const results = {
      remindersSent: 0,
      gracePeriodTransitions: 0,
      hardExpirations: 0,
    };

    // 1. Process 30-day, 7-day, and 1-day reminders
    const expiringSoon = await MembershipRepository.findExpiringSoon(30);
    for (const member of expiringSoon) {
      const daysLeft = Math.ceil((new Date(member.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
      let reminderType = 'T_30_DAYS';
      if (daysLeft <= 1) reminderType = 'T_1_DAY';
      else if (daysLeft <= 7) reminderType = 'T_7_DAYS';

      await MembershipRepository.logRenewalReminder({
        membershipId: member.id,
        reminderType,
        recipientEmail: member.email,
        deliveryStatus: 'SENT',
      });
      results.remindersSent++;
    }

    // 2. Transition active members past expiry to GRACE_PERIOD (14 days)
    const graceMembers = await MembershipRepository.transitionGracePeriods();
    results.gracePeriodTransitions = graceMembers.length;

    // 3. Transition grace-period members past 14 days to EXPIRED
    const expiredMembers = await MembershipRepository.transitionHardExpirations(14);
    results.hardExpirations = expiredMembers.length;

    return results;
  }
}
