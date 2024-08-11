const nodeCron = require('node-cron');
const logger = require('../utilities/logger');
const {query} = require('../database/database');

// Schedule this cron job to run every hour
nodeCron.schedule('0 * * * *', async () => {
    logger.info('Running cron job to revoke expired tokens...');
    
    try {
        // Update tokens that have expired to set `revoked` to true
        const result = await query(`
            UPDATE tokens
            SET revoked = TRUE
            WHERE expires_at < NOW()
            AND revoked = FALSE
        `);
        
        logger.info(`Cron job completed: ${result.rowCount} tokens revoked.`);
    } catch (error) {
        logger.error('Error during token revocation:', error);
    }
});