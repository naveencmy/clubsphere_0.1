import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { checkDatabaseConnection } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { observabilityMiddleware } from './middleware/observability.js';
import { NotFoundError } from './utils/errors.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import experimentRoutes from './routes/experimentRoutes.js';
import membershipRoutes from './routes/membershipRoutes.js';
import merchandiseRoutes from './routes/merchandiseRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import ledgerRoutes from './routes/ledgerRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, '../public');

export const app = express();

// Global observability and request tracing
app.use(observabilityMiddleware);

// Security and utility middleware (CSP disabled to allow Razorpay checkout frame and CDN)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicPath));

if (config.NODE_ENV !== 'test') {
  app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check probes
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'ClubSphere API Gateway',
    version: '1.0.0',
  });
});

app.get(['/health/ready', '/api/health/ready'], async (req, res) => {
  const dbHealth = await checkDatabaseConnection();
  const statusCode = dbHealth.connected ? 200 : 503;
  res.status(statusCode).json({
    status: dbHealth.connected ? 'READY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    database: dbHealth,
  });
});

// Direct interactive checkout page
app.get(['/', '/checkout'], (req, res, next) => {
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Mount core business modules
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/store', merchandiseRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/ledger', ledgerRoutes);

// Mount payment modules (supports /api/create-order and /api/payment/create-order)
app.use('/api/payment', paymentRoutes);
app.use('/api', paymentRoutes);

// Catch 404 routes
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found on this server.`));
});

// Centralized error handling middleware
app.use(errorHandler);
