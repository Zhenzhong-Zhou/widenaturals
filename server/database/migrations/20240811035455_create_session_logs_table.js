/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
    // Create the parent partitioned table (using raw SQL)
    await knex.schema.raw(`
        CREATE TABLE session_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    
    // Create indexes for the partitioned table (using Knex for indexes)
    await knex.schema.table('session_logs', function (table) {
        table.index(['session_id'], 'idx_session_logs_session_id');
        table.index(['employee_id'], 'idx_session_logs_employee_id');
        table.index(['timestamp'], 'idx_session_logs_timestamp');
    });
    
    // Ensure partitions inherit indexes (this part needs to be done manually)
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
exports.down = function (knex) {
    // Drop the partitioned parent table and indexes
    return knex.schema.dropTableIfExists('session_logs');
};