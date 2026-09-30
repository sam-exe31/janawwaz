import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './common/errorHandler';
import { swaggerDocument } from './docs/swagger';
import authRoutes from './auth/authRoutes';
import publicRoutes from './public/publicRoutes';
import userRoutes from './user/userRoutes';
import uploadRoutes from './storage/uploadRoutes';
import requestRoutes from './request/requestRoutes';
import notificationRoutes from './notification/notificationRoutes';
import ngoRoutes from './ngo/ngoRoutes';
import adminRoutes from './admin/adminRoutes';
import volunteerRoutes from './volunteer/volunteerRoutes';
import aiRoutes from './ai/aiRoutes';
import dashboardRoutes from './dashboard/dashboardRoutes';

import path from 'path';

const app = express();

// Security and utility middlewares
app.use(helmet({ contentSecurityPolicy: false })); // Allow Swagger UI inline scripts & demo SPA
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser(config.server.cookieSecret));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static assets from public/ directory
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Health Check
app.get(['/actuator/health', '/health'], (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Swagger UI docs
app.use(['/swagger-ui.html', '/api/docs'], swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1', publicRoutes); // Allow /api/v1/categories, /api/v1/leaderboard, /api/v1/stats
app.use('/api/v1', userRoutes); // Mounts /api/v1/me
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/ngo', ngoRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/volunteer', volunteerRoutes);
app.use('/api/v1/citizen', volunteerRoutes);

// Mount AI, CivicSetu and Advanced Intelligence Dashboard Routes
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/complaints', aiRoutes);
app.use('/api/v1/speech', aiRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/map', dashboardRoutes);
app.use('/api/v1/verification', dashboardRoutes);
app.use('/api/v1/milestones', dashboardRoutes);
app.use('/api/v1/funding', dashboardRoutes);
app.use('/api/v1/projects', dashboardRoutes);
app.use('/api/v1/reports', dashboardRoutes);

// SPA fallback for non-API GET requests: serve index.html if exists
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/actuator')) {
    return res.sendFile(path.join(publicDir, 'index.html'), (err) => {
      if (err) next();
    });
  }
  next();
});

// 404 handler for undefined API routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
      details: [],
    },
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
