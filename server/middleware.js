const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const express = require('express');
const { errors } = require('celebrate');
const { pathToRegexp } = require('path-to-regexp');
const logger = require('./logger');
const serviceMapping = require('./utilities/constants/routePatterns');

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
    
    // Generic error logging middleware
    app.use((err, req, res, next) => {
        if (err.joi) {
            // If the error is a Celebrate validation error, respond with 400
            res.status(400).send('Bad Request');
        } else {
            const service = getServiceName(req.url);
            logger.error(`Error processing request ${req.method} ${req.url}`, {
                context: 'http_error',
                service,
                error: err.message,
                stack: err.stack
            });
            res.status(500).send('Internal Server Error');
        }
    });
};

const configureCors = (app, allowedOrigins) => {
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn('Blocked CORS for:', { origin, context: 'CORS' });
                callback(new Error('Not allowed by CORS'), false);
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
        if (err.message === 'Not allowed by CORS') {
            res.status(403).send('Forbidden');
        } else {
            next(err);
        }
    });
};

module.exports = { configureMiddleware, configureCors };