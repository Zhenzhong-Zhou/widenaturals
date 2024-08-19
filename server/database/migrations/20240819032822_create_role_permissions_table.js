/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('role_permissions', function (table) {
        table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE');
        table.uuid('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
        table.primary(['role_id', 'permission_id']);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.unique(['role_id', 'permission_id'], 'role_permission_unique');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
