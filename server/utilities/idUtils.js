const crypto = require('crypto');
const {query} = require('../database/database');
const logger = require('../utilities/logger');

// Generates a random salt with configurable length
const generateSalt = (length = parseInt(process.env.SALT_LENGTH, 10) || 32) =>
    crypto.randomBytes(length).toString('hex');

// Hashes an ID using a configurable algorithm and provided salt
const hashID = (id, salt, algorithm = process.env.HASH_ALGORITHM || 'sha256') =>
    crypto.createHash(algorithm).update(id + salt).digest('hex');

// Stores the hashed ID in the id_hash_map table
const storeInIdHashMap = async ({ originalID, hashedID, tableName, salt, expiresAt }) => {
    try {
        // Check if the hashed ID already exists to ensure its uniqueness
        logger.info('Checking for existing hashed ID', { hashedID, tableName });
        const existingHashedEntry = await query(
            `SELECT * FROM id_hash_map WHERE hashed_id = $1`,
            [hashedID]
        );
        
        if (existingHashedEntry.length === 0) {
            // Check if the original ID and table name combination already exists
            logger.info('No existing hashed ID found, checking for original ID and table name', { originalID, tableName });
            const existingEntry = await query(
                `SELECT * FROM id_hash_map WHERE original_id = $1 AND table_name = $2`,
                [originalID, tableName]
            );
            
            if (existingEntry.length === 0) {
                // Prepare to insert the new entry
                logger.info('No existing entry found, preparing to insert', { originalID, hashedID, tableName });
                let sql = `
                    INSERT INTO id_hash_map (original_id, hashed_id, table_name, salt, created_at`;
                
                if (expiresAt) {
                    sql += `, expires_at`;
                }
                
                sql += `) VALUES ($1, $2, $3, $4, NOW()`;
                
                if (expiresAt) {
                    sql += `, $5`;
                }
                
                sql += `)`;
                
                const params = expiresAt ? [originalID, hashedID, tableName, salt, expiresAt] : [originalID, hashedID, tableName, salt];
                
                logger.info('Executing insertion query', { params });
                await query(sql, params);
                logger.info('Successfully stored hashed ID in id_hash_map', { originalID, tableName });
            } else {
                logger.info('Entry already exists in id_hash_map for the given original ID and table name, skipping insertion', { originalID, tableName });
            }
        } else {
            logger.warn('Duplicate hashed ID detected, skipping insertion', { originalID, hashedID, tableName });
        }
    } catch (error) {
        logger.error('Error storing in id_hash_map', { error, originalID, hashedID, tableName });
        throw new Error('Failed to store hashed ID in id_hash_map');
    }
};

// Validates the input ID to ensure it's a non-empty string
const validateInput = (id) => {
    if (typeof id !== 'string' || id.length === 0) {
        throw new Error('Invalid ID: ID must be a non-empty string.');
    }
};

// Processes an ID by generating a salt, hashing the ID, and masking the ID
const processID = async (id, tableName) => {
    if (!id) {
        throw new Error('Invalid ID: ID cannot be null or undefined');
    }
    
    // First, check if the ID is already hashed and stored in the id_hash_map
    const existingHash = await query(
        'SELECT hashed_id, salt FROM id_hash_map WHERE original_id = $1 AND table_name = $2',
        [id, tableName]
    );
    
    if (existingHash.length > 0) {
        // Return the existing hashed ID and salt
        return { originalID: id, hashedID: existingHash[0].hashed_id, salt: existingHash[0].salt };
    } else {
        // Generate a new hash and salt
        validateInput(id);
        const salt = generateSalt();
        const hashedID = hashID(id, salt);
        
        // Store the new hashed ID in the id_hash_map
        await storeInIdHashMap({
            originalID: id,
            hashedID,
            tableName,
            salt
        });
        
        return { originalID: id, hashedID, salt };
    }
};

// Processes multiple IDs by iterating over them
const processMultipleIDs = async (ids, tableName) => {
    return await Promise.all(ids.map(id => processID(id, tableName)));
};

// Retrieves the hashed ID from id_hash_map
const getIDFromMap = async (id, tableName, isHashed = true) => {
    // Input validation
    if (!id || typeof id !== 'string') {
        throw new Error('Invalid ID: ID must be a non-empty string');
    }
    
    if (!tableName || typeof tableName !== 'string') {
        throw new Error('Invalid tableName: tableName must be a non-empty string');
    }
    
    try {
        const queryText = isHashed
            ? 'SELECT original_id FROM id_hash_map WHERE hashed_id = $1 AND table_name = $2'
            : 'SELECT hashed_id FROM id_hash_map WHERE original_id = $1 AND table_name = $2';
        
        const result = await query(queryText, [id, tableName]);
        
        if (result.length > 0) {
            return isHashed ? result[0].original_id : result[0].hashed_id;
        } else {
            // Log the missing ID scenario
            logger.warn(`ID not found in ${tableName}: ${isHashed ? 'hashed_id' : 'original_id'} = ${id}`);
            throw new Error(`${tableName.slice(0, -1).toUpperCase()} not found.`);
        }
    } catch (error) {
        // Enhanced logging
        logger.error('Error retrieving ID from id_hash_map', {
            error: error.message,
            stack: error.stack,
            id,
            tableName,
            isHashed
        });
        throw new Error('Failed to retrieve ID from id_hash_map.');
    }
};

// Exports the functions for reuse in other parts of the application
module.exports = {
    generateSalt,
    hashID,
    processID,
    processMultipleIDs,
    storeInIdHashMap,
    getIDFromMap
};