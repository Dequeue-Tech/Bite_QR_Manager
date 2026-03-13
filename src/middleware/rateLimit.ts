import rateLimit from 'express-rate-limit';

export function createRateLimiter() {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const max = Number(process.env.RATE_LIMIT_MAX || 200);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  });
}
