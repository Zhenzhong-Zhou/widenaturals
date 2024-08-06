if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const config = require('config');
const express = require('express');
const logger = require('./logger');
const Joi = require('celebrate').Joi;
const db = require('./database/database');
const { configureMiddleware, configureCors } = require('./middleware');
const { configureRoutes } = require('./routes');

const app = express();

const startServer = async () => {
    try {
        logger.info('Starting server initialization process...', { context: 'initialization' });
        
        // Environment variable validation
        const envVarsSchema = Joi.object({
            NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        }).unknown().required();
        
        const { error } = envVarsSchema.validate(process.env);
        if (error) {
            logger.error('Config validation error', { error: error.message, context: 'initialization' });
            throw new Error(`Config validation error: ${error.message}`);
        }
        
        // Configure middleware
        configureMiddleware(app);
        
        // Configure CORS
        const allowedOrigins = config.get('cors.allowedOrigins');
        configureCors(app, allowedOrigins);
        
        // Configure routes
        configureRoutes(app);
        
        // Catch 404 and forward to error handler
        app.use((req, res, next) => {
            const error = new Error('Not Found');
            error.status = 404;
            next(error);
        });
        
        // Centralized error handling
        app.use((err, req, res, next) => {
            const statusCode = err.status || 500;
            const message = err.message || 'Internal Server Error';
            const details = err.details || null;
            
            // Log the error
            logger.error({
                message: err.message,
                status: statusCode,
                stack: err.stack,
                context: 'error',
            });
            
            // Send the error response
            res.status(statusCode).json({
                status: 'error',
                success: false,
                statusCode,
                message,
                ...(details && { details }),
            });
            
            if (process.env.NODE_ENV === 'development') {
                console.error(err); // Log error stack in development
            }
        });
        
        // Check database health before starting the server
        const health = await db.checkHealth();
        if (health.status === 'DOWN') {
            logger.error('Database health check failed:', { message: health.message, context: 'initialization' });
            process.exit(1);
        }
        
        // Start server
        const port = config.get('server.port');
        app.listen(port, () => {
            logger.info(`Server successfully started and running on port ${port}`, { context: 'initialization' });
            
            // Schedule regular health checks
            setInterval(async () => {
                const health = await db.checkHealth();
                if (health.status !== 'UP') {
                    logger.error('Scheduled health check failed:', health.message);
                } else {
                    logger.info('Scheduled health check passed');
                }
            }, 3600000); // Check every 60 minutes (1 hour)
        });
    } catch (err) {
        logger.error('Server initialization failed', { error: err.message, context: 'initialization' });
        process.exit(1);
    }
};

(async () => {
    try {
        await startServer();
        logger.info('Server started successfully.', { context: 'initialization' });
    } catch (error) {
        logger.error('Server failed to start:', { error: error.message, context: 'initialization' });
        process.exit(1);
    }
})();

// Export the app instance
module.exports = app;