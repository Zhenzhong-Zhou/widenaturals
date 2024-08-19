/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('session_logs', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('session_id').references('id').inTable('sessions').onDelete('CASCADE');
        table.uuid('employee_id').references('id').inTable('employees').onDelete('CASCADE');
        table.string('action').notNullable(); // 'created', 'revoked', 'validated', etc.
        table.string('ip_address');
        table.string('user_agent');
        table.timestamp('timestamp').defaultTo(knex.fn.now());
        
        // Indexes
        table.index('session_id', 'idx_session_logs_session_id');
        table.index('employee_id', 'idx_session_logs_employee_id');
        table.index('timestamp', 'idx_session_logs_timestamp');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('session_logs');
};
