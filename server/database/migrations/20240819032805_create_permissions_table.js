/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('permissions', function (table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('name', 50).notNullable().unique();
        table.text('description');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .then(function () {
        // Add the check constraint after the table is created
        return knex.raw(`
            ALTER TABLE permissions
            ADD CONSTRAINT permissions_name_check CHECK (name <> '');
        `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('permissions');
};