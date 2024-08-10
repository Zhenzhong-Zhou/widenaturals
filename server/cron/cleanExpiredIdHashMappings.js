const nodeCron = require('node-cron');
const logger = require('../utilities/logger');
const { query } = require('../database/database');

// Schedule this cron job to run every day at midnight
nodeCron.schedule('0 0 * * *', async () => {
    logger.info('Running cron job to clean up expired ID hash mappings...');
    
    try {
        // Clean up expired entries in id_hash_map
        const cleanUpResult = await query(`
            DELETE FROM id_hash_map
            WHERE expires_at < NOW()
        `);
        
        logger.info(`Cleanup job completed: ${cleanUpResult.rowCount} hash mappings deleted.`);
    } catch (error) {
        logger.error('Error during hash map cleanup:', error);
    }
});