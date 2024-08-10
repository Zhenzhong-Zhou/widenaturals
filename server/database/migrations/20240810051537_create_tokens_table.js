/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
    return knex.schema.createTable('tokens', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('employee_id').references('id').inTable('employees');
        table.text('token').notNullable();
        table.string('token_type', 50).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('expires_at').notNullable();
        table.boolean('revoked').defaultTo(false);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('tokens');
};
