const helmet = require('helmet');
const compression = require('compression');
const express = require('express');
const cookieParser = require('cookie-parser');
const { errors } = require('celebrate');
const path = require('path');
const { verifyCsrfToken, generateCsrfToken } = require("../middlewares/csrf/csrfProtection");
const { createRateLimiter } = require("../middlewares/rateLimiting/rateLimitMiddleware");
const multerErrorHandler = require("../middlewares/error/multerErrorHandler");
const corsErrorHandler = require("../middlewares/error/corsErrorHandler");
const getServiceName = require("./getServiceName");
const logger = require('./logger');

const configureMiddleware = (app) => {
    // Security middlewares
    app.use(helmet());
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                // Adjust these directives to your needs
                imgSrc: ["'self'", 'data:', 'https:'],
                scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
                // Add more as necessary
            },
        },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        referrerPolicy: { policy: 'no-referrer' },
        hsts: {
            maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
            includeSubDomains: true,
            preload: true,
        },
        xssFilter: true,
        noSniff: true,
        ieNoOpen: true,
        hidePoweredBy: { setTo: 'PHP 4.2.0' },
    }));
    // app.use(securityHeaders); // Add custom security headers here
    
    // Rate limiting
    app.use(createRateLimiter());
    
    // Compression middleware
    app.use(compression());
    
    // Cookie parser middleware
    app.use(cookieParser());
    
    // Body parser middleware
    app.use(express.json());
    
    // CSRF protection middleware
    // app.use(generateCsrfToken); // CSRF token generation
    // app.use(verifyCsrfToken);   // CSRF token verification
    
    if (process.env.NODE_ENV === 'development') {
        app.use('/uploads/profile', express.static(path.join(__dirname, '../../server/uploads/profile')));
    }
    
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
    
    // Multer error handling middleware
    app.use(multerErrorHandler);
    
    // Celebrate errors handling
    app.use(errors());
    
    // Use CORS error handling middleware
    app.use(corsErrorHandler);
};

module.exports = configureMiddleware;