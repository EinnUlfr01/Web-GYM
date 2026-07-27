import rateLimit from 'express-rate-limit';

function mutationLimiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: req => `${req.user?.userId ?? 'anonymous'}:${req.ip ?? 'unknown'}`,
    message: { success: false, message },
  });
}

export const sellerApplicationWriteLimiter = mutationLimiter(15 * 60 * 1000, 30, 'Too many seller application changes. Please try again later.');
export const sellerApplicationSubmitLimiter = mutationLimiter(24 * 60 * 60 * 1000, 5, 'Seller application submit limit reached. Please try again later.');
export const sellerApplicationWithdrawLimiter = mutationLimiter(24 * 60 * 60 * 1000, 10, 'Seller application withdraw limit reached. Please try again later.');

