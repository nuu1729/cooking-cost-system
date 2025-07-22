import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';

import { corsOptions } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { logger } from './utils/logger';

// Routes
import ingredientsRoutes from './routes/ingredients';
import dishesRoutes from './routes/dishes';
import completedFoodsRoutes from './routes/completedFoods';
import reportsRoutes from './routes/reports';
import memoRoutes from './routes/memo';
import uploadRoutes from './routes/upload';
import authRoutes from './routes/auth';

const app = express();

// Trust proxy if behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimitMiddleware);

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '2.0.0'
    });
});

// API Routes
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/dishes', dishesRoutes);
app.use('/api/foods', completedFoodsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/memo', memoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: '料理原価計算システム API',
        version: '2.0.0',
        description: 'モダンな料理原価計算システムのRESTful API',
        endpoints: {
            ingredients: '/api/ingredients',
            dishes: '/api/dishes',
            completedFoods: '/api/foods',
            reports: '/api/reports',
            memo: '/api/memo',
            upload: '/api/upload',
            auth: '/api/auth'
        },
        documentation: '/api/docs',
        health: '/health'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `API endpoint ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});

// Frontend routing fallback (for React Router)
app.get('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'This is an API server. Please access the frontend application.',
        timestamp: new Date().toISOString()
    });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

export default app;