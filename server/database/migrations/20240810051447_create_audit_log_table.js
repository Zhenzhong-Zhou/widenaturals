/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
    return knex.schema.createTable('audit_logs', (table) => { // Return the promise
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('table_name', 100).notNullable();
        table.string('action', 50).notNullable();
        table.uuid('record_id').notNullable();
        table.uuid('employee_id').references('id').inTable('employees');
        table.timestamp('changed_at').defaultTo(knex.fn.now());
        table.jsonb('old_data');
        table.jsonb('new_data');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('audit_logs');
};
