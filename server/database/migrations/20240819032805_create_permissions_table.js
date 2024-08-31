/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('permissions', function (table) {
            table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
            table.string('name', 50).notNullable().unique();
            table.text('description');
            table.boolean('is_active').notNullable().defaultTo(true); // Soft deletion indicator
            table.timestamp('created_at').defaultTo(knex.fn.now());
            table.timestamp('updated_at').defaultTo(knex.fn.now());
        })
        .then(function () {
            // Add the check constraint after the table is created
            return knex.raw(`
                ALTER TABLE permissions
                ADD CONSTRAINT permissions_name_check CHECK (name <> '');
        `);
        })
        .then(function () {
            // Create a trigger to update the `updated_at` timestamp on update
            return knex.raw(`
                CREATE OR REPLACE FUNCTION update_permissions_timestamp()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
    
                CREATE TRIGGER update_permissions_updated_at
                BEFORE UPDATE ON permissions
                FOR EACH ROW
                EXECUTE PROCEDURE update_permissions_timestamp();
            `);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('permissions').then(function () {
        // Drop the trigger and function if the table is dropped
        return knex.raw(`
            DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
            DROP FUNCTION IF EXISTS update_permissions_timestamp;
        `);
    });
};