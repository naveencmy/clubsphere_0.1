import { z } from 'zod';
import { EventService } from '../services/eventService.js';
import { sendSuccess } from '../utils/response.js';

export const reserveTicketSchema = z.object({
  tierId: z.string().uuid('Invalid tier ID format'),
});

export const confirmTicketPaymentSchema = z.object({
  stripePaymentIntentId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  paymentId: z.string().optional(),
  orderId: z.string().optional(),
});

export const checkInSchema = z.object({
  ticketCode: z.string().optional(),
  rawQrString: z.string().optional(),
  station: z.string().optional(),
  timestamp: z.coerce.number().optional(),
  nonce: z.string().optional(),
  signature: z.string().optional(),
}).refine(data => data.ticketCode || data.rawQrString, {
  message: 'Either ticketCode or rawQrString must be provided',
});

export class EventController {
  static async getEvents(req, res, next) {
    try {
      const events = await EventService.getEvents(req.clubId);
      return sendSuccess(res, events, 'Events retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getEventDetails(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const details = await EventService.getEventDetails(req.params.eventId, userId);
      return sendSuccess(res, details, 'Event details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async reserveTicket(req, res, next) {
    try {
      const reservation = await EventService.reserveTicket({
        eventId: req.params.eventId,
        tierId: req.body.tierId,
        userId: req.user.id,
      });
      return sendSuccess(res, reservation, 'Ticket reserved for 10 minutes', 201);
    } catch (err) {
      next(err);
    }
  }

  static async confirmPayment(req, res, next) {
    try {
      const result = await EventService.confirmTicketPayment(
        req.params.ticketId,
        req.body.stripePaymentIntentId
      );
      return sendSuccess(res, result, 'Ticket payment confirmed');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Sub-200ms latency Door Scanner check-in endpoint.
   */
  static async checkIn(req, res, next) {
    const startTime = Date.now();
    try {
      let ticketCode = req.body.ticketCode;
      let timestamp = req.body.timestamp;
      let nonce = req.body.nonce;
      let signature = req.body.signature;

      if (!ticketCode && req.body.rawQrString) {
        const raw = req.body.rawQrString;
        if (raw.startsWith('CS1:')) {
          const parts = raw.split(':');
          if (parts.length >= 3) {
            ticketCode = parts[2];
            if (parts.length >= 4) signature = parts[3];
          }
        } else {
          try {
            const parsed = JSON.parse(raw);
            ticketCode = parsed.ticketCode || parsed.code;
            timestamp = parsed.timestamp;
            nonce = parsed.nonce;
            signature = parsed.signature;
          } catch {
            ticketCode = raw;
          }
        }
      }

      const result = await EventService.rapidDoorCheckIn({
        eventId: req.params.eventId,
        ticketCode,
        timestamp,
        nonce,
        signature,
        scannedByUserId: req.user.id,
      });

      const latencyMs = Date.now() - startTime;
      return sendSuccess(res, { ...result, latencyMs }, 'Check-in validated successfully', 200, { latencyMs });
    } catch (err) {
      next(err);
    }
  }

  static async getReconciliation(req, res, next) {
    try {
      const reconciliation = await EventService.getEventReconciliation(req.params.eventId);
      return sendSuccess(res, reconciliation, 'Event financial reconciliation retrieved');
    } catch (err) {
      next(err);
    }
  }
}
