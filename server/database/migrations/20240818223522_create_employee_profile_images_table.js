/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('employee_profile_images', function(table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('employee_id').references('id').inTable('employees').onDelete('CASCADE');
        table.string('image_path', 255).notNullable();  // Path to the image file in storage
        table.string('image_type', 50).notNullable();  // e.g., 'image/jpeg', 'image/png'
        table.integer('image_size').notNullable();  // File size in bytes, must be positive
        table.string('thumbnail_path', 255);  // Optional: Path to the thumbnail image, if applicable
        table.string('image_hash', 64);  // Optional: Hash of the image file for integrity checks and deduplication
        table.timestamp('uploaded_at').defaultTo(knex.fn.now());  // Timestamp when the image was uploaded
        table.timestamp('updated_at').defaultTo(knex.fn.now());  // Initial timestamp for when the image was last updated
        
        // Create an index on employee_id for faster lookups
        table.index('employee_id', 'idx_employee_profile_images_employee_id');
    }).then(() => {
        // Add the check constraint for allowed image types
        return  knex.raw(`
            ALTER TABLE employee_profile_images
            ADD CONSTRAINT chk_image_type
            CHECK (image_type IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'));
        `);
    })
    .then(() => {
        // Create the trigger function if it doesn't exist
        return knex.raw(`
            CREATE OR REPLACE FUNCTION trigger_set_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
    })
    .then(() => {
        // Create the trigger to update 'updated_at' on row update
        return knex.raw(`
            CREATE TRIGGER update_employee_profile_images_updated_at
            BEFORE UPDATE ON employee_profile_images
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTableIfExists('employee_profile_images')
        .then(() => knex.raw('DROP TRIGGER IF EXISTS update_employee_profile_images_updated_at ON employee_profile_images'))
        .then(() => knex.raw('DROP FUNCTION IF EXISTS trigger_set_timestamp'));
};