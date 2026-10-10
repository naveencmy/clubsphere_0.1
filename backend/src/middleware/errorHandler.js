import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  // If response headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Zod Request Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    return sendError(res, 'Request validation failed', 400, formattedErrors, 'VALIDATION_ERROR');
  }

  // 2. Custom Domain Application Errors
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details, err.name.toUpperCase());
  }

  // 3. PostgreSQL Specific Database Errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return sendError(
          res,
          'A record with this identifier already exists in the system.',
          409,
          { detail: err.detail },
          'UNIQUE_VIOLATION'
        );
      case '23503': // Foreign key violation
        return sendError(
          res,
          'Referenced record does not exist or has active dependencies.',
          400,
          { detail: err.detail },
          'FOREIGN_KEY_VIOLATION'
        );
      case '23514': // Check constraint violation
        return sendError(
          res,
          'Database validation constraint failed.',
          400,
          { detail: err.detail, constraint: err.constraint },
          'CHECK_CONSTRAINT_VIOLATION'
        );
      case '40P01': // Deadlock detected
        return sendError(
          res,
          'Transaction concurrency deadlock detected. Please retry the operation.',
          409,
          null,
          'CONCURRENCY_DEADLOCK'
        );
      case '55P03': // Lock not available
        return sendError(
          res,
          'Resource is currently locked by another operation. Please try again.',
          409,
          null,
          'LOCK_UNAVAILABLE'
        );
      default:
        break;
    }
  }

  // 4. Unhandled Internal Server Errors
  console.error('💥 Unhandled Exception:', err);
  const message = config.NODE_ENV === 'production' ? 'An unexpected internal error occurred' : err.message;
  const details = config.NODE_ENV === 'production' ? null : { stack: err.stack };

  return sendError(res, message, 500, details, 'INTERNAL_SERVER_ERROR');
}
