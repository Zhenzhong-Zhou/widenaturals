const logger = require('./logger');
const db = require('../database/database');

const gracefulShutdown = (server) => {
    logger.info('SIGTERM/SIGINT signal received: closing HTTP server');
    server.close(async () => {
        logger.info('HTTP server closed');
        try {
            await db.gracefulShutdown();
            logger.info('Database pool closed');
            process.exit(0);
        } catch (err) {
            logger.error('Error during shutdown', { error: err.message });
            process.exit(1);
        }
    });
    
    // Force shutdown if not complete within a certain timeframe
    setTimeout(() => {
        logger.error('Shutdown timed out, forcing exit.');
        process.exit(1);
    }, 10000); // 10 seconds timeout
};

module.exports = {
    gracefulShutdown,
};