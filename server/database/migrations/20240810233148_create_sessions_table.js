/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
    return knex.schema.createTable('sessions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('employee_id').references('id').inTable('employees').onDelete('CASCADE');
        table.text('token').notNullable().unique();  // Store JWT token or session identifier
        table.string('user_agent');  // Store the user's device information (optional)
        table.string('ip_address');  // Store the IP address (optional)
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('expires_at').notNullable();  // Store session expiration time
        table.boolean('revoked').defaultTo(false);  // Track if the session is revoked
        
        table.check('expires_at > NOW()');
        
        table.index('employee_id');
        table.index('token');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('sessions');
};
