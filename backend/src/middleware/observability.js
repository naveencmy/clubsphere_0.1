import crypto from 'crypto';

/**
 * Observability & Telemetry Middleware.
 * Instruments each HTTP request with a unique trace ID and execution latency counter.
 */
export function observabilityMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  const startTime = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-ClubSphere-Service', 'ClubSphere-API');

  // Set latency header before response is finalized
  const originalEnd = res.end;
  res.end = function (...args) {
    if (!res.headersSent) {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1_000_000;
      res.setHeader('X-Response-Time-Ms', durationMs.toFixed(2));
    }
    return originalEnd.apply(this, args);
  };

  next();
}
