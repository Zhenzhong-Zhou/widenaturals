/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('route_permissions', function (table) {
            table.string('route', 255).primary();
            table.string('permission', 50).notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        .then(function () {
            // Add the check constraint after the table is created
            return knex.raw(`
            ALTER TABLE route_permissions
            ADD CONSTRAINT route_permission_check CHECK (permission <> '');
        `);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('route_permissions');
};