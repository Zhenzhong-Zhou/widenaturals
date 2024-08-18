/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function(knex) {
    return knex.schema.createTable('table_metadata', function(table) {
        table.string('table_name', 100).primary(); // Primary key on table_name
        table.string('key', 100).notNullable();
        table.text('description');
        
        // Create index on table_name and display_name
        table.index(['table_name', 'key'], 'idx_table_metadata');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function(knex) {
    return knex.schema.dropTable('table_metadata');
};