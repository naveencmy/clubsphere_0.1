/**
 * Formats and sends a successful standard JSON response.
 * 
 * @param {import('express').Response} res
 * @param {any} data - Payload data
 * @param {string} [message='Operation successful']
 * @param {number} [statusCode=200]
 * @param {object|null} [meta=null]
 */
export function sendSuccess(res, data = null, message = 'Operation successful', statusCode = 200, meta = null) {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

/**
 * Formats and sends an error standard JSON response.
 * 
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {any} [details=null]
 * @param {string} [errorCode='INTERNAL_ERROR']
 */
export function sendError(res, message = 'Internal Server Error', statusCode = 500, details = null, errorCode = 'ERROR') {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
    },
  });
}
