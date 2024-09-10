/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
    // Create the parent partitioned table (using raw SQL)
    await knex.schema.raw(`
        CREATE TABLE IF NOT EXISTS session_logs (
            id UUID DEFAULT uuid_generate_v4(),
            session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
            employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
            action VARCHAR(255) NOT NULL,
            ip_address VARCHAR(255),
            user_agent VARCHAR(255),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) PARTITION BY RANGE (DATE_TRUNC('month', timestamp));
    `);
    
    // Optionally create the first partition for the current month
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const nextMonth = String(currentDate.getMonth() + 2).padStart(2, '0');
    
    await knex.schema.raw(`
        CREATE TABLE IF NOT EXISTS session_logs_${currentYear}_${currentMonth}
        PARTITION OF session_logs
        FOR VALUES FROM ('${currentYear}-${currentMonth}-01') TO ('${currentYear}-${nextMonth}-01');
    `);
    
    // Apply unique indexes on each partition individually
    await knex.schema.raw(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_session_logs_${currentYear}_${currentMonth}_id
        ON session_logs_${currentYear}_${currentMonth} (id);
    `);
    
    // Create other indexes for the partitioned table (using Knex for indexes)
    await knex.schema.raw(`
        CREATE INDEX IF NOT EXISTS idx_session_logs_session_id
        ON session_logs_${currentYear}_${currentMonth} (session_id);
    `);
    await knex.schema.raw(`
        CREATE INDEX IF NOT EXISTS idx_session_logs_employee_id
        ON session_logs_${currentYear}_${currentMonth} (employee_id);
    `);
    await knex.schema.raw(`
        CREATE INDEX IF NOT EXISTS idx_session_logs_timestamp
        ON session_logs_${currentYear}_${currentMonth} (timestamp);
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
    // Drop the partitions and the partitioned parent table
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    await knex.schema.raw(`
        DROP TABLE IF EXISTS session_logs_${currentYear}_${currentMonth};
    `);
    
    // Drop the parent partitioned table
    return knex.schema.raw('DROP TABLE IF EXISTS session_logs');
};