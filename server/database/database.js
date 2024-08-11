const {Pool} = require('pg');
const logger = require('../utilities/logger');
const knexConfig = require("./knexfile");
const knex = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);
require('dotenv').config();

// Configuration settings
const getDatabaseConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        max: isProduction ? 30 : 15,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        database: process.env[isProduction ? 'PROD_DB_NAME' : 'DEV_DB_NAME'],
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
    };
};

// Initialize the connection pool
const pool = new Pool(getDatabaseConfig());
let poolEnded = false;

// Event listeners for the pool
const setupEventListeners = () => {
    pool.on('connect', client => {
        logger.info('Database connection established', {database: client.connectionParameters.database});
    });
    
    pool.on('error', (err, client) => {
        logger.error('Unexpected error on idle client', {
            error: err.message,
            database: client.connectionParameters.database
        });
        process.exit(-1);
    });
};

setupEventListeners();

// Health check function
const checkHealth = async () => {
    if (poolEnded) {
        logger.warn('Health check attempted after pool has been shut down.');
        return {status: 'DOWN', message: 'Database connection pool is shut down.'};
    }
    
    try {
        const start = Date.now();
        await pool.query('SELECT 1;');
        const duration = Date.now() - start;
        logger.info(`Health check query executed in ${duration}ms.`);
        return {status: 'UP', message: 'Database connection is healthy.'};
    } catch (error) {
        logger.error('Database health check failed', {error: error.message});
        return {status: 'DOWN', message: 'Database connection is not healthy.', error: error.message};
    }
};

// Graceful shutdown function
const gracefulShutdown = async () => {
    if (poolEnded) return;
    poolEnded = true;
    
    logger.info('Shutting down database connection pool...');
    try {
        await pool.end();
        logger.info('Database connection pool has ended.');
    } catch (error) {
        logger.error('Error during pool shutdown', {error: error.message});
    }
};

// Query execution function
const executeQuery = async (text, params) => {
    if (poolEnded) {
        throw new Error('Query attempted after pool has been shut down.');
    }
    
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (duration > 500) {
            logger.warn('Slow query detected', {text, duration, rows: result.rowCount});
        } else {
            logger.info('Executed query', {text, duration, rows: result.rowCount});
        }
        return result.rows;
    } catch (error) {
        logger.error('Error executing query', {text, params, error: error.message});
        throw error;
    }
};

// Initialize database function for development and testing
const initializeDatabase = async () => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        try {
            await knex.migrate.latest();
            await knex.seed.run();
            console.log('Database initialized');
        } catch (error) {
            logger.error('Database initialization failed', {error: error.message});
            throw error;
        }
    }
};

// Exported module functions
module.exports = {
    query: executeQuery,
    checkHealth,
    gracefulShutdown,
    initializeDatabase
};