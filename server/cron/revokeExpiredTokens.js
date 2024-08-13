const nodeCron = require('node-cron');
const logger = require('../utilities/logger');
const { query } = require('../database/database');

// Schedule the cron job to run every hour
nodeCron.schedule('0 * * * *', async () => {
    const startTime = new Date();
    logger.info('Running job to revoke expired tokens...');
    
    const maxRetries = 3;
    let attempts = 0;
    
    while (attempts < maxRetries) {
        try {
            // Optionally log the number of tokens that will be revoked
            const { rowCount: toBeRevokedCount } = await query(`
                SELECT COUNT(*) FROM tokens
                WHERE expires_at < NOW()
                AND revoked = FALSE
            `);
            
            logger.info(`Found ${toBeRevokedCount} tokens to revoke.`);
            
            // Update tokens that have expired to set `revoked` to true
            const result = await query(`
                UPDATE tokens
                SET revoked = TRUE
                WHERE expires_at < NOW()
                AND revoked = FALSE
            `);
            
            const endTime = new Date();
            const duration = (endTime - startTime) / 1000;
            
            logger.info(`Job completed: ${result.rowCount} tokens revoked in ${duration} seconds.`);
            break; // Exit loop after successful execution
        } catch (error) {
            attempts++;
            logger.error(`Attempt ${attempts} failed during token revocation:`, {
                message: error.message,
                stack: error.stack,
                query: `
                    UPDATE tokens
                    SET revoked = TRUE
                    WHERE expires_at < NOW()
                    AND revoked = FALSE
                `
            });
            
            if (attempts >= maxRetries) {
                logger.error('Max retries reached. Job failed.');
            } else {
                logger.info(`Retrying token revocation... (${attempts}/${maxRetries})`);
            }
        }
    }
});