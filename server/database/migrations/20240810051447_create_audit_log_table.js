/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('audit_logs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('context').notNullable();
        table.string('table_name', 100).notNullable();
        table.string('action', 50).notNullable();
        table.uuid('record_id').notNullable();
        table.uuid('employee_id').references('id').inTable('employees');
        table.timestamp('changed_at').defaultTo(knex.fn.now());
        table.jsonb('old_data');
        table.jsonb('new_data');
        
        // Indexes for performance
        table.index('table_name', 'idx_audit_logs_table_name');
        table.index('action', 'idx_audit_logs_action');
        table.index('record_id', 'idx_audit_logs_record_id');
        table.index('employee_id', 'idx_audit_logs_employee_id');
        table.index('context', 'idx_audit_logs_context');
        table.index('changed_at', 'idx_audit_logs_changed_at');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('audit_logs');
};