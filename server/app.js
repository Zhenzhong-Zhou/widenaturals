const express = require('express');
const { Joi } = require('celebrate');
const { configureMiddleware } = require('./utilities/middleware');
const configureCors = require('./utilities/cors');
const configureRoutes = require('./routes/routes');
const logger = require('./utilities/logger');

const validateEnvironmentVariables = (port) => {
    const envVarsSchema = Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        PORT: Joi.number().default(port),
    }).unknown().required();
    
    const { error } = envVarsSchema.validate(process.env);
    if (error) {
        logger.error('Config validation error', { error: error.message, context: 'initialization' });
        throw new Error(`Config validation error: ${error.message}`);
    }
};

const configureApp = (config) => {
    const app = express();
    const port = parseInt(process.env.PORT, 10) || config.server.port;
    
    validateEnvironmentVariables(port);
    
    configureMiddleware(app);
    const allowedOrigins = (config.cors && config.cors.allowedOrigins) || [];
    configureCors(app, allowedOrigins);
    configureRoutes(app);
    
    app.use((req, res, next) => {
        const error = new Error('Not Found');
        error.status = 404;
        next(error);
    });
    
    app.use((err, req, res, next) => {
        const statusCode = err.status || 500;
        const message = err.message || 'Internal Server Error';
        const details = err.details || null;
        
        logger.error({
            message: err.message,
            status: statusCode,
            stack: err.stack,
            context: 'error',
        });
        
        res.status(statusCode).json({
            status: 'error',
            success: false,
            statusCode,
            message,
            ...(details && { details }),
        });
        
        if (process.env.NODE_ENV === 'development') {
            console.error(err);
        }
    });
    
    return app;
};

module.exports = configureApp;