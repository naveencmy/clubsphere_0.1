import { z } from 'zod';
import { MembershipService } from '../services/membershipService.js';
import { sendSuccess } from '../utils/response.js';

export const registerMembershipSchema = z.object({
  tier: z.enum(['GENERAL', 'VIP', 'OFFICER']).default('GENERAL'),
  duesPaid: z.boolean().default(true),
});

export const verifyPassSchema = z.object({
  qrSecretToken: z.string().min(1, 'QR secret token is required'),
  timestamp: z.coerce.number(),
  nonce: z.string().min(1, 'Nonce is required'),
  signature: z.string().min(1, 'Signature is required'),
});

export class MembershipController {
  static async register(req, res, next) {
    try {
      const { tier, duesPaid } = req.body;
      const membership = await MembershipService.registerMembership({
        clubId: req.clubId,
        userId: req.user.id,
        tier,
        duesPaid,
      });
      return sendSuccess(res, membership, 'Membership registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async getRotatingPass(req, res, next) {
    try {
      const pass = await MembershipService.generateRotatingQrPass(req.clubId, req.user.id);
      return sendSuccess(res, pass, 'Digital membership pass generated');
    } catch (err) {
      next(err);
    }
  }

  static async verifyPass(req, res, next) {
    try {
      const result = await MembershipService.verifyDigitalPass({
        clubId: req.clubId,
        ...req.body,
      });

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PASS', message: result.error },
        });
      }

      return sendSuccess(res, result.membership, 'Member verification successful');
    } catch (err) {
      next(err);
    }
  }

  static async runExpirationJob(req, res, next) {
    try {
      const results = await MembershipService.runExpirationCheck();
      return sendSuccess(res, results, 'Expiration check completed');
    } catch (err) {
      next(err);
    }
  }
}
