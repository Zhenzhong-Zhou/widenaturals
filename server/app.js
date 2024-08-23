const express = require('express');
const validateEnvironmentVariables = require("./utilities/validateEnv");
const configureCors = require('./utilities/cors');
const configureMiddleware = require('./utilities/middleware');
const configureRoutes = require('./routes/routes');
const notFoundHandler = require("./middlewares/error/notFoundMiddleware");
const { handleErrors } = require("./middlewares/error/errorHandler");
const corsErrorHandler = require("./middlewares/error/corsErrorHandler");

const configureApp = (config) => {
    const app = express();
    const port = parseInt(process.env.PORT, 10) || config.server.port;
    
    validateEnvironmentVariables(port);
    
    // Allowed origins for CORS
    const allowedOrigins = [process.env.DEV_CLIENT_ORIGIN, process.env.PROD_CLIENT_ORIGIN];
    
    // Configure CORS
    configureCors(app, allowedOrigins);
    
    // Configure other middlewares
    configureMiddleware(app);
    
    // Route configuration
    configureRoutes(app);
    
    // Use CORS error handling middleware
    app.use(corsErrorHandler);
    
    // Handle 404 errors
    app.use(notFoundHandler);
    
    // Global error handler
    app.use(handleErrors);
    
    return app;
};

module.exports = configureApp;