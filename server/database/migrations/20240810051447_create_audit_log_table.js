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
        table.index('table_name');
        table.index('action');
        table.index('record_id');
        table.index('employee_id');
        table.index('context');
        table.index('changed_at');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('audit_logs');
};