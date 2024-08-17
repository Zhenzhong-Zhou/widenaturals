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
        
        table.index('employee_id', 'idx_employee_passwords_employee_id');
        
    }).then(function () {
        // Ensure the trigger function exists (if not already created)
        return knex.raw(`
            CREATE OR REPLACE FUNCTION update_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
    }).then(function () {
        // Create the trigger for auto-updating 'updated_at' timestamp
        return knex.raw(`
            CREATE TRIGGER update_employee_passwords_updated_at
            BEFORE UPDATE ON employee_passwords
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
    // Drop the trigger first
    return knex.raw('DROP TRIGGER IF EXISTS update_employee_passwords_updated_at ON employee_passwords')
        .then(function () {
            // Drop the table
            return knex.schema.dropTable('employee_passwords');
        }).then(function () {
            // Optionally, drop the trigger function (if not shared)
            return knex.raw('DROP FUNCTION IF EXISTS update_timestamp()');
        });
};