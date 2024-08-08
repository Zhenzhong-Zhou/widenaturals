const { Pool } = require('pg');
const logger = require('../utilities/logger');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
    max: isProduction ? 30 : 15,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    database: isProduction ? process.env.PROD_DB_NAME : process.env.DEV_DB_NAME,
    user: isProduction ? process.env.PROD_DB_USER : process.env.DEV_DB_USER,
    password: isProduction ? process.env.PROD_DB_PASSWORD : process.env.DEV_DB_PASSWORD,
    host: isProduction ? process.env.PROD_DB_HOST : process.env.DEV_DB_HOST,
    port: isProduction ? process.env.PROD_DB_PORT : process.env.DEV_DB_PORT,
});

pool.on('connect', client => {
    logger.info('Database connection established', { database: client.connectionParameters.database });
});

pool.on('error', (err, client) => {
    logger.error('Unexpected error on idle client', { error: err.message, database: client.connectionParameters.database });
    process.exit(-1);
});

let poolEnded = false;

const checkHealth = async () => {
    if (poolEnded) {
        logger.warn('Health check attempted after pool has been shut down.');
        return { status: 'DOWN', message: 'Database connection pool is shut down.' };
    }
    
    try {
        const start = Date.now();
        await pool.query('SELECT 1;');
        const duration = Date.now() - start;
        logger.info(`Health check query executed in ${duration}ms.`);
        return { status: 'UP', message: 'Database connection is healthy.' };
    } catch (error) {
        logger.error('Database health check failed', { error: error.message });
        return { status: 'DOWN', message: 'Database connection is not healthy.', error: error.message };
    }
};

const gracefulShutdown = async () => {
    if (poolEnded) return;
    poolEnded = true;
    
    logger.info('Shutting down database connection pool...');
    try {
        await pool.end();
        logger.info('Database connection pool has ended.');
    } catch (error) {
        logger.error('Error during pool shutdown', { error: error.message });
    }
};

module.exports = {
    query: async (text, params) => {
        if (poolEnded) {
            throw new Error('Query attempted after pool has been shut down.');
        }
        
        const start = Date.now();
        try {
            const result = await pool.query(text, params);
            const duration = Date.now() - start;
            if (duration > 500) {
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
    gracefulShutdown,
};