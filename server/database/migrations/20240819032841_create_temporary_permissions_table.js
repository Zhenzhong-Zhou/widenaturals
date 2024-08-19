/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('temporary_permissions', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('employee_id').references('id').inTable('employees').onDelete('RESTRICT'); // Prevent deletion
        table.uuid('permission_id').references('id').inTable('permissions').onDelete('RESTRICT'); // Prevent deletion
        table.timestamp('expires_at').notNullable();
        table.string('status', 50).notNullable().defaultTo('active'); // Status to indicate if permission is active or expired
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
    })
    .then(function () {
        // Create a trigger to update the `updated_at` timestamp on update
        return knex.raw(`
            CREATE OR REPLACE FUNCTION update_temporary_permissions_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
    
            CREATE TRIGGER update_temporary_permissions_updated_at
            BEFORE UPDATE ON temporary_permissions
            FOR EACH ROW
            EXECUTE PROCEDURE update_temporary_permissions_timestamp();
        `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('temporary_permissions').then(function () {
        // Drop the trigger and function if the table is dropped
        return knex.raw(`
            DROP TRIGGER IF EXISTS update_temporary_permissions_updated_at ON temporary_permissions;
            DROP FUNCTION IF EXISTS update_temporary_permissions_timestamp;
        `);
    });
};