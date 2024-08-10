exports.up = function(knex) {
    return knex.schema.createTable('id_hash_map', function(table) {
        table.uuid('original_id').notNullable();
        table.string('hashed_id', 64).notNullable().unique();
        table.string('table_name', 100).notNullable();
        table.string('salt', 64);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('expires_at');
        table.jsonb('metadata');
        
        table.primary(['original_id', 'table_name']);
        table.unique(['hashed_id', 'table_name']);
    });
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('id_hash_map');
};
