/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
    return knex.schema.createTable('employee_passwords', (table) => {
        table.uuid('employee_id').primary().references('id').inTable('employees').onDelete('CASCADE');
        table.string('password_hash', 255).notNullable();
        table.string('password_salt', 255);
        table.timestamp('last_changed_at').defaultTo(knex.fn.now());
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
    return knex.schema.dropTable('employee_passwords');
};