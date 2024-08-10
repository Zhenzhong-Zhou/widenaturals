/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
    return knex.schema.createTable('employees', function(table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('first_name', 50).notNullable();
        table.string('last_name', 50).notNullable();
        table.string('email', 100).notNullable().unique();
        table.string('phone_number', 20).notNullable();
        table.string('password', 255).notNullable();
        table.string('job_title', 100).notNullable();
        table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at');
        table.timestamp('last_login');
        table.integer('failed_attempts').defaultTo(0);
        table.timestamp('lockout_time');
        table.string('status', 50).defaultTo('active').notNullable().checkIn(['active', 'inactive', 'terminated']);
        table.uuid('created_by').references('id').inTable('employees').onDelete('SET NULL');
        table.uuid('updated_by').references('id').inTable('employees').onDelete('SET NULL');
        table.jsonb('metadata');
    }).then(function() {
        return knex.raw(`
            -- Add check constraints for email and phone_number
            ALTER TABLE employees
            ADD CONSTRAINT email_check CHECK (email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'),
            ADD CONSTRAINT phone_number_check CHECK (phone_number ~ '^\\(\\d{3}\\)-\\d{3}-\\d{4}$');

            -- Create trigger and function for updating updated_at
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER update_employees_updated_at
            BEFORE UPDATE ON employees
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('employees').then(function() {
        return knex.raw(`
            -- Drop the trigger and function if the table is dropped
            DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
            DROP FUNCTION IF EXISTS update_updated_at_column;
        `);
    });
};
