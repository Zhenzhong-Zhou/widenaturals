const helmet = require('helmet');
const compression = require('compression');
const express = require('express');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const {errors} = require('celebrate');
const path = require('path');
const {verifyCsrfToken, generateCsrfToken} = require("../middlewares/csrf/csrfProtection");
const {createRateLimiter} = require("../middlewares/rateLimiting/rateLimitMiddleware");
const multerErrorHandler = require("../middlewares/error/multerErrorHandler");
const corsErrorHandler = require("../middlewares/error/corsErrorHandler");
const getServiceName = require("./getServiceName");
const logger = require('./logger');

const configureMiddleware = (app) => {
    // 1. Logging middleware for HTTP requests (should be early to log all requests)
    app.use(async (req, res, next) => {
        const start = Date.now();
        const { service } = await getServiceName(req.url);
        
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
                statusCode: res.statusCode,
                duration: `${duration}ms`
            });
        });
        next();
    });
    
    // 2. Security middlewares (Helmet)
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
        crossOriginResourcePolicy: {policy: 'cross-origin'},
        referrerPolicy: {policy: 'no-referrer'},
        hsts: {
            maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
            includeSubDomains: true,
            preload: true,
        },
        xssFilter: true,
        noSniff: true,
        ieNoOpen: true,
    }));
    
    // 3. Compression middleware (Optimize performance)
    app.use(compression({
        level: 6, // Adjust the compression level as needed
        threshold: 1024, // Only compress responses larger than 1KB
    }));
    
    // 4. Rate limiting middleware (For security purposes)
    app.use(createRateLimiter());
    
    // 5. Cookie parser middleware (Needed for accessing cookies in other middleware)
    app.use(cookieParser());
    
    // 6. Body parser middleware (Needed for accessing request bodies)
    app.use(express.json());
    
    // 7. Serve favicon
    app.use(favicon(path.join(__dirname, '../../client/public', 'favicon.ico')));
    
    // 8. CSRF protection middleware (Comes after body and cookie parsing)
    app.use(verifyCsrfToken);   // CSRF token verification
    
    // Serve static files in development mode
    if (process.env.NODE_ENV === 'development') {
        app.use('/uploads/profile', express.static(path.join(__dirname, '../../server/uploads/profile')));
    }
    
    // 9. Multer error handling middleware (for file upload errors)
    app.use(multerErrorHandler);
    
    // 10. Celebrate errors handling (for validation errors)
    app.use(errors());
    
    // 11. Use CORS error handling middleware
    app.use(corsErrorHandler);
};

module.exports = configureMiddleware;