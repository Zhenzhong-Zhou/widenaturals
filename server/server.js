const configureApp = require('./app');
const {loadConfig, getConfigPath} = require('./utilities/config');
const logger = require('./utilities/logger');
const {gracefulShutdown} = require('./utilities/shutdown');
const db = require('./database/database');
const detect = require('detect-port');

let configPath = getConfigPath();
let config;

try {
    config = loadConfig(configPath);
} catch (err) {
    logger.error('Failed to load configuration file', {error: err.message});
    process.exit(1);
}

const defaultPort = parseInt(process.env.PORT, 10) || config.server.port;
let server;

const startServer = async (port = defaultPort) => {
    try {
        const availablePort = await detect(port);
        
        if (availablePort !== port) {
            logger.warn(`Port ${port} in use, using available port ${availablePort}`);
        }
        
        const app = configureApp(config);
        server = app.listen(availablePort, () => {
            logger.info(`Server successfully started and running on port ${availablePort}`, {context: 'initialization'});
            console.log('Server successfully started');
            
            // Start health checks after server has started
            db.startHealthCheck(900000); // every 1 hour
        });
        
        server.on('error', (err) => {
            logger.error('Server initialization failed', {error: err.message, context: 'initialization'});
            process.exit(1);
        });
        
        // Gracefully shutdown on SIGTERM and SIGINT
        process.on('SIGINT', () => gracefulShutdown(server));
        process.on('SIGTERM', () => gracefulShutdown(server));
        
        return server;
    } catch (err) {
        logger.error('Failed to start server', {error: err.message});
        process.exit(1);
    }
};

const stopServer = async () => {
    if (server) {
        try {
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) {
                        logger.error('Error closing server', {error: err.message});
                        return reject(err);
                    }
                    resolve();
                });
            });
            await db.gracefulShutdown(); // This will also stop health checks
            logger.info('Server and database shutdown completed.');
        } catch (err) {
            logger.error('Error during server shutdown', {error: err.message});
            throw err;
        }
    }
};

module.exports = {startServer, stopServer, app: configureApp(config)};

// Immediately Invoked Function Expression (IIFE) to start the server
(async () => {
    try {
        // Initialize the database
        await db.initializeDatabase();
        
        // Start the server
        await startServer(parseInt(process.env.PORT) || config.server.port);
        logger.info('Server started successfully.', {context: 'initialization'});
    } catch (error) {
        logger.error('Server failed to start:', {error: error.message, context: 'initialization'});
        process.exit(1);
    }
})();