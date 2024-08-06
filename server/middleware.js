const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const express = require('express');
const { errors } = require('celebrate');
const logger = require('./logger');

const configureMiddleware = (app) => {
    // Security middlewares
    app.use(helmet());
    app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
    
    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs,
        message: 'Too many requests from this IP, please try again later.',
    });
    app.use(limiter);
    
    // Body parser middleware
    app.use(express.json());
    
    // Logging middleware
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.url}`, { context: 'request' });
        next();
    });
    
    // Celebrate errors handling
    app.use(errors());
};

const configureCors = (app, allowedOrigins) => {
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn('Blocked CORS for:', { origin, context: 'CORS' });
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    };
    
    app.use(cors(corsOptions));
};

module.exports = { configureMiddleware, configureCors };