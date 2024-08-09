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
        table.check('email', knex.raw("email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'"));
        table.string('phone_number', 20).notNullable();
        table.check('phone_number', knex.raw("phone_number ~ '^\\(\\d{3}\\)-\\d{3}-\\d{4}$'"));
        table.string('password', 255).notNullable();
        table.string('job_title', 100).notNullable();
        table.string('role', 50).notNullable().defaultTo('employee').checkIn(['admin', 'manager', 'employee']);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('last_login');
        table.string('status', 50).defaultTo('active').checkIn(['active', 'inactive', 'terminated']);
        table.uuid('created_by').references('id').inTable('employees').onDelete('SET NULL');
        table.uuid('updated_by').references('id').inTable('employees').onDelete('SET NULL');
        table.jsonb('metadata');
    }).then(function() {
        return knex.raw(`
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
    return knex.schema.dropTableIfExists('employees');
};
