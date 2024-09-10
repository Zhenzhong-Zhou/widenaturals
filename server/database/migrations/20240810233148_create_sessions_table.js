/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('sessions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));  // Primary key UUID
        table.uuid('employee_id').references('id').inTable('employees').onDelete('CASCADE');  // Foreign key to employees table
        table.text('token').notNullable().unique();  // Store JWT token or session identifier
        table.string('user_agent');  // Store the user's device information (optional)
        table.string('ip_address');  // Store the IP address (optional)
        table.timestamp('created_at').defaultTo(knex.fn.now());  // Automatically set timestamp on creation
        table.timestamp('expires_at').notNullable();  // Store session expiration time
        table.boolean('revoked').defaultTo(false);  // Track if the session is revoked
        
        // New version column for optimistic locking
        table.bigInteger('version').defaultTo(1).notNullable();
        
        // Constraints and indexes
        table.index('employee_id', 'idx_sessions_employee_id');
        table.index('created_at', 'idx_sessions_created_at');
        table.index('token', 'idx_sessions_token');
    })
    .then(() => {
        // Add a check constraint using raw SQL
        return knex.raw(`
            ALTER TABLE sessions
            ADD CONSTRAINT version_non_decreasing CHECK (version > 0)`);
    })
    .then(() => {
        // Unique index for id and version combination
        return knex.raw('CREATE UNIQUE INDEX idx_sessions_id_version ON sessions(id, version)');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('sessions');
};