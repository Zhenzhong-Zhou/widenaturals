const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const express = require('express');
const { errors } = require('celebrate');
const { pathToRegexp } = require('path-to-regexp');
const logger = require('./logger');
const serviceMapping = require('./constants/routePatterns');
const { CustomError, handleErrors } = require('../middlewares/errorHandler');

const getServiceName = (url) => {
    for (const { pattern, service } of serviceMapping) {
        const regexp = pathToRegexp(pattern);
        if (regexp.test(url)) {
            return service;
        }
    }
    return 'general_service';
};

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
    
    // Logging middleware for HTTP requests
    app.use((req, res, next) => {
        const start = Date.now();
        const service = getServiceName(req.url);
        
        logger.info(`${req.method} ${req.url}`, { context: 'http_request', service });
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info(`${req.method} ${req.url}`, {
                context: 'http_response',
                service,
                headers: req.headers,
                body: req.body,
                statusCode: res.statusCode,
                duration: `${duration}ms`
            });
        });
        next();
    });
    
    // Celebrate errors handling
    app.use(errors());
    
    // Custom error handling middleware
    app.use(handleErrors);
};

const configureCors = (app, allowedOrigins) => {
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn('Blocked CORS for:', { origin, context: 'CORS' });
                callback(new CustomError(403, 'Not allowed by CORS'), false);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    };
    
    app.use(cors(corsOptions));
    
    // CORS error handling middleware
    app.use((err, req, res, next) => {
        if (err instanceof CustomError && err.statusCode === 403) {
            res.status(403).send('Forbidden');
        } else {
            next(err);
        }
    });
};

module.exports = { configureMiddleware, configureCors };