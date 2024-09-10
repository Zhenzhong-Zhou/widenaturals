/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('route_permissions', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()')); // UUID as primary key
        table.string('route', 255).unique().notNullable(); // Route path stored as a unique string
        table.string('service', 100).notNullable(); // Service related to the route
        table.uuid('permission_id').references('id').inTable('permissions').onDelete('CASCADE'); // Foreign key to permissions table
        table.integer('cache_duration').defaultTo(600); // Cache duration (default 600 seconds)
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        
        // Add unique constraint on route and permission_id
        table.unique(['route', 'permission_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('route_permissions');
};