/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
    return knex.schema.createTable('token_logs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('token_id').references('id').inTable('tokens');
        table.string('token_type', 50).notNullable();
        table.string('action', 50).notNullable();
        table.uuid('employee_id').references('id').inTable('employees').onDelete('SET NULL');
        table.timestamp('performed_at').defaultTo(knex.fn.now());
        table.string('ip_address', 45);
        table.text('user_agent');
        table.jsonb('details');
        
        // Indexes
        table.index('token_id', 'idx_token_logs_token_id');
        table.index('employee_id', 'idx_token_logs_employee_id');
        table.index('performed_at', 'idx_token_logs_performed_at');
        table.index('action', 'idx_token_logs_action');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('token_logs');
};