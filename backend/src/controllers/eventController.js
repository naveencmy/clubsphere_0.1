import { z } from 'zod';
import { EventService } from '../services/eventService.js';
import { sendSuccess } from '../utils/response.js';

export const reserveTicketSchema = z.object({
  tierId: z.string().uuid('Invalid tier ID format'),
});

export const confirmTicketPaymentSchema = z.object({
  stripePaymentIntentId: z.string().optional(),
});

export const checkInSchema = z.object({
  ticketCode: z.string().min(1, 'Ticket code is required'),
  timestamp: z.coerce.number().optional(),
  nonce: z.string().optional(),
  signature: z.string().optional(),
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
      const result = await EventService.rapidDoorCheckIn({
        eventId: req.params.eventId,
        ticketCode: req.body.ticketCode,
        timestamp: req.body.timestamp,
        nonce: req.body.nonce,
        signature: req.body.signature,
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
