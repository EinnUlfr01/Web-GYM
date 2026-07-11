import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { sessionMiddleware } from './middleware/session';
import { csrfProtection, generateCsrfToken } from './middleware/csrf';
import { sanitizeMiddleware } from './middleware/sanitize';
import { createAuditMiddleware } from './middleware/auditLogger';
import { securityHeaders } from './middleware/securityHeaders';
import authRoutes from './modules/auth/auth.routes';
import referralRoutes from './modules/referral/referral.routes';
import couponRoutes from './modules/coupon/coupon.routes';
import loyaltyRoutes from './modules/loyalty/loyalty.routes';
import auditRoutes from './modules/audit/audit.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import crmRoutes from './modules/crm/crm.routes';
import ticketRoutes from './modules/tickets/ticket.routes';
import invoiceRoutes from './modules/invoices/invoice.routes';
import backupRoutes from './modules/backup/backup.routes';
import revenueRoutes from './modules/revenue/revenue.routes';
import coachRoutes from './modules/coaches/coach.routes';
import planRoutes from './modules/plans/plans.routes';
import videoRoutes from './modules/videos/videos.routes';
import exercisesRoutes from './modules/exercises';
import bookingRoutes from './modules/bookings/bookings.routes';
import productRoutes from './modules/products/products.routes';
import mediaRoutes from './modules/media/media.routes';
import { cartRouter, addressRouter, checkoutRouter, orderRouter, adminRouter } from './modules/commerce/commerce.routes';

const app = express();

// Security middleware stack
app.use(securityHeaders);
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(sanitizeMiddleware);
app.use(createAuditMiddleware());
app.use(apiLimiter);
if (config.nodeEnv === 'development') app.use(morgan('dev'));

app.use('/uploads', express.static('uploads'));
app.use('/image', express.static('D:\\gymer\\image', {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
  }
}));
app.use('/media', express.static('public/media', {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.svg') || filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', filePath.endsWith('.svg') ? 'image/svg+xml' : 'image/webp');
    }
  }
}));

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'Gymer API running', timestamp: new Date().toISOString() }));

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = generateCsrfToken(req);
  res.json({ csrfToken: token });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/cart', cartRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/orders', orderRouter);
app.use('/api/admin', adminRouter);

// CSRF protection for state-changing routes
app.use(csrfProtection);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
