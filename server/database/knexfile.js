/**
 * @type {path.PlatformPath | path}
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const baseConfig = {
    client: 'postgresql',
    connection: {
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT,
    },
    migrations: {
        directory: path.resolve(__dirname, '../database/migrations'),
        tableName: 'knex_migrations'
    },
    seeds: {
        directory: path.resolve(__dirname, '../database/seeds')
    }
};

module.exports = {
    development: {
        ...baseConfig,
        connection: {
            ...baseConfig.connection,
            database: process.env.DEV_DB_NAME || baseConfig.connection.database,
        },
        pool: {
            min: 2,
            max: 10
        }
    },
    
    test: {
        ...baseConfig,
        connection: {
            ...baseConfig.connection,
            database: process.env.TEST_DB_NAME || baseConfig.connection.database,
        },
        pool: {
            min: 2,
            max: 5
        }
    },
    
    staging: {
        ...baseConfig,
        connection: {
            ...baseConfig.connection,
            database: process.env.STAGING_DB_NAME || baseConfig.connection.database,
        },
        pool: {
            min: 2,
            max: 20
        }
    },
    
    production: {
        ...baseConfig,
        connection: {
            ...baseConfig.connection,
            database: process.env.PROD_DB_NAME || baseConfig.connection.database,
        },
        pool: {
            min: 2,
            max: 30
        }
    }
};