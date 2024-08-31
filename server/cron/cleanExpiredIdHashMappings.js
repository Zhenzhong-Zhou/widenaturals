const nodeCron = require('node-cron');
const logger = require('../utilities/logger');
const {query} = require('../database/database');

// Function to log deletions in the audit_logs table
const logDeletion = async (recordId, tableName, oldData) => {
    const insertAuditQuery = `
        INSERT INTO audit_logs (
            context,
            table_name,
            action,
            record_id,
            old_data
        ) VALUES ($1, $2, $3, $4, $5)
    `;
    
    const auditValues = [
        'ID Hash Map Deletion',  // Context of the action
        tableName,               // The table from which the record is deleted
        'DELETE',                // Action type
        recordId,                // ID of the record being deleted
        JSON.stringify(oldData)  // Data before deletion
    ];
    
    await query(insertAuditQuery, auditValues);
};

// Schedule this cron job to run every day at midnight
nodeCron.schedule('0 0 * * *', async () => {
    logger.info('Running cron job to clean up expired ID hash mappings...');
    
    const startTime = Date.now();
    
    try {
        // Select the expired entries before deletion for auditing purposes
        const expiredEntries = await query(`
            SELECT original_id, hashed_id, table_name, expires_at, metadata
            FROM id_hash_map
            WHERE expires_at < NOW()
        `);
        
        // Log each deletion and then delete the record
        for (const entry of expiredEntries.rows) {
            await logDeletion(entry.original_id, entry.table_name, entry);
            
            // Delete the entry from the id_hash_map
            await query('DELETE FROM id_hash_map WHERE original_id = $1 AND table_name = $2', [entry.original_id, entry.table_name]);
        }
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        logger.info(`Cleanup job completed: ${expiredEntries.rowCount} hash mappings deleted and logged in ${duration} seconds.`);
    } catch (error) {
        logger.error('Error during hash map cleanup:', {
            message: error.message,
            stack: error.stack,
            query: 'DELETE FROM id_hash_map WHERE expires_at < NOW()'
        });
    }
});