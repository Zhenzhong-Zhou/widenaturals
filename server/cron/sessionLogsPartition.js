const cron = require('node-cron');
const { query } = require('../database/database');
const logger = require('../utilities/logger');

// Function to create the partition and indexes
const createPartitionAndIndexes = async () => {
    logger.info("Partitioning session_logs");
    
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);  // Start of the next month
    
    const partitionName = `session_logs_${nextMonth.getFullYear()}_${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 2).padStart(2, '0')}-01`;
    
    const createPartitionQuery = `
        CREATE TABLE IF NOT EXISTS ${partitionName} PARTITION OF session_logs
        FOR VALUES FROM ('${startOfMonth}') TO ('${endOfMonth}');
    `;
    
    const createUniqueIndexQuery = `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_${partitionName}_id ON ${partitionName} (id);
    `;
    
    const createIndexesQuery = `
        CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON ${partitionName} (session_id);
        CREATE INDEX IF NOT EXISTS idx_session_logs_employee_id ON ${partitionName} (employee_id);
        CREATE INDEX IF NOT EXISTS idx_session_logs_timestamp ON ${partitionName} (timestamp);
    `;
    
    try {
        // Execute the partition creation query
        await query(createPartitionQuery);
        
        // Execute the unique index creation query
        await query(createUniqueIndexQuery);
        
        // Execute the index creation query
        await query(createIndexesQuery);
        
        logger.info(`Partition ${partitionName} and indexes created successfully.`);
    } catch (error) {
        logger.error(`Error creating partition ${partitionName} or indexes:`, error);
    }
};

// Run the cron job on the first day of every month
cron.schedule('0 0 1 * *', createPartitionAndIndexes);

if (process.env.NODE_ENV !== 'production') {
    // For testing purposes, run it immediately
    (async () => {
        await createPartitionAndIndexes();
    })();
}