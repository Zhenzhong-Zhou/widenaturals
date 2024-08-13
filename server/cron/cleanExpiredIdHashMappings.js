const nodeCron = require('node-cron');
const logger = require('../utilities/logger');
const { query } = require('../database/database');

// Schedule this cron job to run every day at midnight
nodeCron.schedule('0 0 * * *', async () => {
    logger.info('Running cron job to clean up expired ID hash mappings...');

    const startTime = Date.now();

    try {
        // Clean up expired entries in id_hash_map
        const cleanUpResult = await query(`
            DELETE FROM id_hash_map
            WHERE expires_at < NOW()
        `);

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        logger.info(`Cleanup job completed: ${cleanUpResult.rowCount} hash mappings deleted in ${duration} seconds.`);
    } catch (error) {
        logger.error('Error during hash map cleanup:', {
            message: error.message,
            stack: error.stack,
            query: 'DELETE FROM id_hash_map WHERE expires_at < NOW()'
        });
    }
});