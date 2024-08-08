const logger = require('./logger');
const db = require('../database/database');

const gracefulShutdown = (server) => {
    logger.info('SIGINT/SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        logger.info('HTTP server closed');
        await db.gracefulShutdown();
        logger.info('Database pool closed');
        process.exit(0);
    });
};

module.exports = {
    gracefulShutdown,
};