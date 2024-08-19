/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('temporary_permissions', function (table) {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.uuid('employee_id').references('id').inTable('employees');
            table.uuid('permission_id').references('id').inTable('permissions');
            table.timestamp('expires_at').notNullable();
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
            
            // Apply unique constraint without a name first
            table.unique(['employee_id', 'permission_id']);
        })
        .then(function () {
            // Rename the constraint to the desired name after the table is created
            return knex.raw(`
            ALTER TABLE temporary_permissions
            RENAME CONSTRAINT temporary_permissions_employee_id_permission_id_unique TO temp_permission_unique;
        `);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('temporary_permissions');
};