const { Pool } = require('pg');
const logger = require('../utilities/logger');
const knexConfig = require("./knexfile");
const knex = require('knex')(knexConfig[process.env.NODE_ENV || 'development']);
require('dotenv').config();

let poolEnded = false;
let ongoingOperations = 0;
let healthCheckInterval = null;

// Increment the counter before starting an operation
const incrementOperations = () => {
    ongoingOperations++;
    console.log('Incremented ongoing operations:', ongoingOperations);
};

// Decrement the counter after completing an operation
const decrementOperations = () => {
    ongoingOperations--;
    console.log('Decremented ongoing operations:', ongoingOperations);
};

// Getter for ongoing operations count (for testing)
const getOngoingOperationsCount = () => {
    return ongoingOperations;
};

// Wait for all ongoing operations to complete
const waitForOperationsToCompleteWithTimeout = async (timeout = 10000) => {
    let timedOut = false;
    setTimeout(() => {
        timedOut = true;
    }, timeout);
    
    while (ongoingOperations > 0 && !timedOut) {
        await new Promise(resolve => setTimeout(resolve, 100));  // Check every 100ms
    }
    
    if (timedOut) {
        logger.error('Timeout reached while waiting for pending operations to complete');
    } else {
        logger.info('All operations completed within the timeout period.');
    }
};

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

// Event listeners for the pool
const setupEventListeners = () => {
    pool.on('connect', client => {
        logger.info('Database connection established', { database: client.connectionParameters.database });
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

// Start health checks
const startHealthCheck = (interval = 60000) => {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
    }
    healthCheckInterval = setInterval(async () => {
        try {
            await checkHealth();
        } catch (error) {
            logger.error('Scheduled health check failed', { error: error.message });
        }
    }, interval);
    logger.info('Health check started with an interval of', interval, 'ms');
};

// Stop health checks
const stopHealthCheck = () => {
    if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
        logger.info('Health checks stopped.');
    }
};

// Graceful shutdown function
const gracefulShutdown = async () => {
    if (poolEnded) return;
    poolEnded = true;
    
    // Stop the health checks
    stopHealthCheck();
    
    logger.info('Waiting for pending operations to complete before shutting down the database connection pool...');
    
    // Ensure all pending operations (like token generation) are complete before shutdown
    try {
        // Wait for all ongoing operations to complete
        await waitForOperationsToCompleteWithTimeout();
        
        logger.info('All pending operations completed.');
    } catch (error) {
        logger.error('Error waiting for pending operations to complete', { error: error.message });
    }
    
    logger.info('Shutting down database connection pool...');
    try {
        await pool.end();
        logger.info('Database connection pool has ended.');
    } catch (error) {
        logger.error('Error during pool shutdown', { error: error.message });
    }
};

// Query execution function
const executeQuery = async (text, params) => {
    if (poolEnded) {
        throw new Error('Query attempted after pool has been shut down.');
    }
    
    incrementOperations();
    
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
    } finally {
        decrementOperations();
    }
};

// Initialize database function for development and testing
const initializeDatabase = async () => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        try {
            await knex.migrate.latest();
            await knex.seed.run();
            logger.info('Database initialized');
        } catch (error) {
            logger.error('Database initialization failed', { error: error.message });
            throw error;
        }
    }
};

// Exported module functions
module.exports = {
    query: executeQuery,
    checkHealth,
    startHealthCheck,
    stopHealthCheck,
    gracefulShutdown,
    incrementOperations,
    decrementOperations,
    getOngoingOperationsCount,
    waitForOperationsToCompleteWithTimeout,
    initializeDatabase
};