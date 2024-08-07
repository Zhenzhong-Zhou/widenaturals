if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const config = require('config');
const express = require('express');
const Joi = require('celebrate').Joi;
const logger = require('./utilities/logger');
const db = require('./database/database');
const { configureMiddleware, configureCors } = require('./utilities/middleware');
const { configureRoutes } = require('./routes');

const app = express();

let isShuttingDown = false;

const startServer = async (port) => {
    try {
        logger.info('Starting server initialization process...', { context: 'initialization' });
        
        // Environment variable validation
        const envVarsSchema = Joi.object({
            NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
            PORT: Joi.number().default(port),
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
                console.error(err);
            }
        });
        
        // Check database health before starting the server
        const health = await db.checkHealth();
        if (health.status === 'DOWN') {
            logger.error('Database health check failed:', { message: health.message, context: 'initialization' });
            process.exit(1);
        }
        
        const startListening = (attempt = 0) => {
            const serverPort = port + attempt;
            const server = app.listen(serverPort, () => {
                logger.info(`Server successfully started and running on port ${serverPort}`, { context: 'initialization' });
                
                setInterval(async () => {
                    const health = await db.checkHealth();
                    if (health.status !== 'UP') {
                        logger.error('Scheduled health check failed:', health.message);
                    } else {
                        logger.info('Scheduled health check passed');
                    }
                }, 3600000);
            });
            
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    logger.warn(`Port ${serverPort} in use, retrying with port ${serverPort + 1}`);
                    startListening(attempt + 1);
                } else {
                    logger.error('Server initialization failed', { error: err.message, context: 'initialization' });
                    process.exit(1);
                }
            });
            
            // Gracefully handle shutdown
            const shutdown = async () => {
                if (isShuttingDown) return;
                isShuttingDown = true;
                
                if (process.env.NODE_ENV === 'development') {
                    // Do not exit process if running tests
                    logger.info('Skipping graceful shutdown during tests');
                    return;
                }
                
                logger.info('SIGINT/SIGTERM signal received: closing HTTP server');
                server.close(async () => {
                    logger.info('HTTP server closed');
                    await db.gracefulShutdown();
                    logger.info('Database pool closed');
                    process.exit(0);
                });
            };
            
            process.on('SIGINT', shutdown);
            process.on('SIGTERM', shutdown);
        };
        
        startListening();
    } catch (err) {
        logger.error('Server initialization failed', { error: err.message, context: 'initialization' });
        process.exit(1);
    }
};

(async () => {
    try {
        await startServer(parseInt(process.env.PORT) || config.get('server.port'));
        logger.info('Server started successfully.', { context: 'initialization' });
    } catch (error) {
        logger.error('Server failed to start:', { error: error.message, context: 'initialization' });
        process.exit(1);
    }
})();

// Export the app instance
module.exports = app;