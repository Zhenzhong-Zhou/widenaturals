/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('roles', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('name', 50).notNullable().unique();
        table.text('description');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).then(function () {
        // Create a trigger to update the `updated_at` timestamp on update
        return knex.raw(`
            CREATE OR REPLACE FUNCTION update_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER update_roles_updated_at
            BEFORE UPDATE ON roles
            FOR EACH ROW
            EXECUTE PROCEDURE update_timestamp();
        `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('roles').then(function () {
        // Drop the trigger and function if the table is dropped
        return knex.raw(`
            DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
            DROP FUNCTION IF EXISTS update_timestamp;
        `);
    });
};
