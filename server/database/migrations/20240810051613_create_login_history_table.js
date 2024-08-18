/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('login_history', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('employee_id').references('id').inTable('employees').onDelete('CASCADE');
        table.timestamp('login_at').defaultTo(knex.fn.now());
        table.string('ip_address', 45);
        table.text('user_agent');
        
        // Create indexes
        table.index('employee_id', 'idx_login_history_employee_id');
        table.index('login_at', 'idx_login_history_login_at');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('login_history');
};