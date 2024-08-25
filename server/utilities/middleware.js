const helmet = require('helmet');
const compression = require('compression');
const express = require('express');
const cookieParser = require('cookie-parser');
const { errors } = require('celebrate');
const { verifyCsrfToken, generateCsrfToken } = require("../middlewares/csrf/csrfProtection");
const { createRateLimiter } = require("../middlewares/rateLimiting/rateLimitMiddleware");
const multerErrorHandler = require("../middlewares/error/multerErrorHandler");
const corsErrorHandler = require("../middlewares/error/corsErrorHandler");
const getServiceName = require("./getServiceName");
const logger = require('./logger');

// Custom Security Headers Middleware
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
};

const configureMiddleware = (app) => {
    // Security middlewares
    app.use(helmet());
    app.use(helmet.crossOriginResourcePolicy({
        crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resources if needed
        referrerPolicy: { policy: 'no-referrer' }, // Adjust referrer policy as needed
        // Enforce HTTPS using Strict-Transport-Security
        hsts: {
            maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
            includeSubDomains: true, // Apply this rule to all subdomains as well
            preload: true, // Allow your domain to be included in the HSTS preload list
        },
        xssFilter: true, // X-XSS-Protection header to prevent reflected XSS attacks
        noSniff: true, // X-Content-Type-Options header to prevent MIME-type sniffing
        ieNoOpen: true, // X-Download-Options for IE8+ to prevent executing downloads in the site's context
        hidePoweredBy: { setTo: 'PHP 4.2.0' }, // Hide X-Powered-By to disguise technology stack
    }));
    app.use(securityHeaders); // Add custom security headers here
    
    // Compression middleware
    app.use(compression());
    
    // Cookie parser middleware
    app.use(cookieParser());
    
    // Body parser middleware
    app.use(express.json());
    
    // CSRF protection middleware
    app.use(generateCsrfToken); // CSRF token generation
    app.use(verifyCsrfToken);   // CSRF token verification
    
    // Rate limiting
    app.use(createRateLimiter());
    
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