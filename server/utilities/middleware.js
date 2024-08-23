const helmet = require('helmet');
const compression = require('compression');
const express = require('express');
const cookieParser = require('cookie-parser');
const { errors } = require('celebrate');
const {createRateLimiter} = require("../middlewares/rateLimiting/rateLimitMiddleware");
const multerErrorHandler = require("../middlewares/error/multerErrorHandler");
const { handleErrors } = require('../middlewares/error/errorHandler');
const getServiceName = require("./getServiceName");
const logger = require('./logger');

const configureMiddleware = (app) => {
    // Security middlewares
    app.use(helmet());
    app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
    
    // Compression middleware
    app.use(compression());
    
    // Cookie parser middleware
    app.use(cookieParser());
    
    // Body parser middleware
    app.use(express.json());
    
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
    
    // Custom error handling middleware
    app.use(handleErrors);
};

module.exports = configureMiddleware;