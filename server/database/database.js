const { Pool } = require('pg');
const logger = require('../logger');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = new Pool({
    max: isProduction ? 20 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    database: isProduction ? process.env.PROD_DB_NAME : process.env.DEV_DB_NAME,
    user: isProduction ? process.env.PROD_DB_USER : process.env.DEV_DB_USER,
    password: isProduction ? process.env.PROD_DB_PASSWORD : process.env.DEV_DB_PASSWORD,
    host: isProduction ? process.env.PROD_DB_HOST : process.env.DEV_DB_HOST,
    port: isProduction ? process.env.PROD_DB_PORT : process.env.DEV_DB_PORT,
});

poolConfig.on('connect', client => {
    logger.info('Database connection established', { database: client.connectionParameters.database });
});

poolConfig.on('error', (err, client) => {
    logger.error('Unexpected error on idle client', { error: err.message, database: client.connectionParameters.database });
    process.exit(-1);
});

const checkHealth = async () => {
    try {
        const start = Date.now();
        await poolConfig.query('SELECT 1;');
        const duration = Date.now() - start;
        logger.info(`Health check query executed in ${duration}ms.`);
        return { status: 'UP', message: 'Database connection is healthy.' };
    } catch (error) {
        logger.error('Database health check failed', { error: error.message });
        return { status: 'DOWN', message: 'Database connection is not healthy.', error: error.message };
    }
};

const gracefulShutdown = () => {
    poolConfig.end(() => {
        logger.info('Database connection pool has ended.');
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
    query: async (text, params) => {
        const start = Date.now();
        try {
            const result = await poolConfig.query(text, params);
            const duration = Date.now() - start;
            if (duration > 500) { // Log queries taking more than 500ms
                logger.warn('Slow query detected', { text, duration, rows: result.rowCount });
            } else {
                logger.info('Executed query', { text, duration, rows: result.rowCount });
            }
            return result.rows;
        } catch (error) {
            logger.error('Error executing query', { text, params, error: error.message });
            throw error;
        }
    },
    checkHealth,
};