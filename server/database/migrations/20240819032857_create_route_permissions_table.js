/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('route_permissions', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()')); // UUID as primary key
        table.string('route', 255).unique().notNullable(); // Route path stored as a unique string
        table.uuid('permission_id').references('id').inTable('permissions').onDelete('CASCADE'); // Foreign key to permissions
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('route_permissions');
};