import { z } from 'zod';
import { AuthService } from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  studentId: z.string().optional(),
  role: z.enum(['STUDENT', 'VOLUNTEER', 'COMMITTEE_LEAD', 'TREASURER', 'ASSOCIATION_COORDINATOR', 'ASSOCIATION_INCHARGE', 'ADMIN']).default('STUDENT'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      return sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      return sendSuccess(res, { user: req.user }, 'Current user profile');
    } catch (err) {
      next(err);
    }
  }
}
