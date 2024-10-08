/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('employees', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('first_name', 50).notNullable();
        table.string('last_name', 50).notNullable();
        table.string('email', 100).notNullable().unique();
        table.string('phone_number', 20).notNullable();
        table.string('job_title', 100).notNullable();
        table.uuid('role_id').references('id').inTable('roles').onDelete('CASCADE');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at');
        table.timestamp('last_login');
        table.integer('failed_attempts').defaultTo(0);
        table.timestamp('lockout_time');
        table.string('status', 50).defaultTo('active').notNullable().checkIn(['active', 'inactive', 'terminated']);
        
        // Adding 2FA fields
        table.string('two_factor_code', 6);
        table.timestamp('two_factor_expires');
        table.boolean('two_factor_enabled').defaultTo(false);
        table.string('two_factor_method', 10); // 'sms' or 'email'
        
        table.uuid('created_by').references('id').inTable('employees').onDelete('SET NULL');
        table.uuid('updated_by').references('id').inTable('employees').onDelete('SET NULL');
        table.jsonb('metadata');
        
        // Indexes
        table.index('role_id', 'idx_employees_role_id');
        table.index('created_by', 'idx_employees_created_by');
        table.index('updated_by', 'idx_employees_updated_by');
        table.index('status', 'idx_employees_status');
        table.index('last_login', 'idx_employees_last_login');
        table.index('created_at', 'idx_employees_created_at');
    }).then(function () {
        return knex.raw(`
            -- Add check constraints for email, phone_number, and job_title
            ALTER TABLE employees
            ADD CONSTRAINT email_format_check CHECK (email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'),
            ADD CONSTRAINT phone_number_format_check CHECK (phone_number ~ '^\\(\\d{3}\\)-\\d{3}-\\d{4}$'),
            ADD CONSTRAINT job_title_format_check CHECK (job_title ~ '^[A-Z][a-z]*( [A-Z][a-z]*)*$');

            -- Create trigger and function for updating updated_at specifically for employees
            CREATE OR REPLACE FUNCTION update_employees_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER update_employees_updated_at
            BEFORE UPDATE ON employees
            FOR EACH ROW EXECUTE FUNCTION update_employees_updated_at_column();
        `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('employees').then(function () {
        return knex.raw(`
            -- Drop the trigger and function if the table is dropped
            DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
            DROP FUNCTION IF EXISTS update_employees_updated_at_column;
        `);
    });
};