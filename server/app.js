const express = require('express');
const {Joi} = require('celebrate');
const {configureMiddleware} = require('./utilities/middleware');
const configureCors = require('./utilities/cors');
const configureRoutes = require('./routes/routes');
const notFoundHandler = require("./middlewares/NotFoundMiddleware");
const {handleErrors} = require("./middlewares/errorHandler");
const logger = require('./utilities/logger');

const validateEnvironmentVariables = (port) => {
    const envVarsSchema = Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        PORT: Joi.number().default(port),
    }).unknown().required();
    
    const {error} = envVarsSchema.validate(process.env);
    if (error) {
        logger.error('Config validation error', {error: error.message, context: 'initialization'});
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
    
    // Handle 404 errors
    app.use(notFoundHandler);
    
    // Global error handler
    app.use(handleErrors);
    
    return app;
};

module.exports = configureApp;