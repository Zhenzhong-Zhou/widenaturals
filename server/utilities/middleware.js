const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const { errors } = require('celebrate');
const logger = require('./logger');
const getServiceName = require("./getServiceName");
const { CustomError, handleErrors } = require('../middlewares/errorHandler');

const configureMiddleware = (app) => {
    // Security middlewares
    app.use(helmet());
    app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
    
    // Compression middleware
    app.use(compression());
    
    // Cookie parser middleware
    app.use(cookieParser());
    
    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 500, // limit each IP to 500 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
    });
    app.use(limiter);
    
    // Body parser middleware
    app.use(express.json());
    
    // Logging middleware for HTTP requests
    app.use((req, res, next) => {
        const start = Date.now();
        const service = getServiceName(req.url);
        
        logger.info(`Handling request: ${req.method} ${req.url}`, {
            context: 'http_request',
            service,
            url: req.url,
            method: req.method
        });
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info(`Completed request: ${req.method} ${req.url}`, {
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

// Configure CORS
const configureCors = (app, allowedOrigins) => {
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`Blocked CORS request from origin: ${origin}`, {
                    context: 'CORS',
                    origin: origin,
                    timestamp: new Date().toISOString(),
                    action: 'Blocked'
                });
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