# WIDE Naturals

# Knex
```
To Create 
knex migrate:make [filename] --env development


To Run Migration: Use the Knex CLI to run the migration.
knex migrate:latest

Remove the Migration Record:
DELETE FROM knex_migrations WHERE name = 'file name';

Run the seed:
knex seed:run

To Rollback: If you need to rollback the migration:
knex migrate:rollback
OR
knex migrate:rollback --all
```