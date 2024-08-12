const crypto = require('crypto');
const {query} = require('../database/database');
const jwt = require('jsonwebtoken');
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
        // Check if the entry already exists
        const existingEntry = await query(
            `SELECT * FROM id_hash_map WHERE original_id = $1 AND table_name = $2`,
            [originalID, tableName]
        );
        
        if (existingEntry.length === 0) {
            // Prepare the SQL statement with conditional logic for expires_at
            let sql = `
                INSERT INTO id_hash_map (original_id, hashed_id, table_name, salt, created_at`;
            
            // Add expires_at if it's provided
            if (expiresAt) {
                sql += `, expires_at`;
            }
            
            sql += `) VALUES ($1, $2, $3, $4, NOW()`;
            
            // Add expires_at value if it's provided
            if (expiresAt) {
                sql += `, $5`;
            }
            
            sql += `)`;
            
            // Prepare the parameters
            const params = expiresAt ? [originalID, hashedID, tableName, salt, expiresAt] : [originalID, hashedID, tableName, salt];
            
            // Execute the query
            await query(sql, params);
            logger.info('Successfully stored hashed ID in id_hash_map', { originalID, tableName });
        } else {
            logger.info('Entry already exists in id_hash_map, skipping insertion', { originalID, tableName });
        }
    } catch (error) {
        if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
            logger.warn('Duplicate entry detected, skipping insertion', { originalID, hashedID, tableName });
        } else {
            logger.error('Error storing in id_hash_map', { error, originalID, hashedID, tableName });
            throw new Error('Failed to store hashed ID in id_hash_map');
        }
    }
};

// Masks an ID by hiding all but the last 4 characters
const maskID = (id) => id.replace(/.(?=.{4})/g, '*');

// Validates the input ID to ensure it's a non-empty string
const validateInput = (id) => {
    if (typeof id !== 'string' || id.length === 0) {
        throw new Error('Invalid ID: ID must be a non-empty string.');
    }
};

// Processes an ID by generating a salt, hashing the ID, and masking the ID
const processID = (id, version = 1) => {
    validateInput(id);
    const salt = generateSalt();
    const hashedID = hashID(id, salt);
    const maskedID = maskID(id);
    
    return {originalID: id, hashedID, maskedID, salt, version};
};

// Processes multiple IDs by iterating over them
const processMultipleIDs = (ids) => ids.map(processID);

// Retrieves the hashed ID from id_hash_map
const getHashedIDFromMap = async (originalID, tableName) => {
    try {
        const result = await query(
            'SELECT hashed_id FROM id_hash_map WHERE original_id = $1 AND table_name = $2',
            [originalID, tableName]
        );
        return result.length > 0 ? result[0].hashed_id : null;
    } catch (error) {
        console.error('Error retrieving hashed ID from id_hash_map:', error);
        throw new Error('Failed to retrieve hashed ID from id_hash_map');
    }
};

// Validates the token by comparing the hashed employee ID in the token payload with the hashed ID stored in the map
const validateToken = async (token, secret, options = {}) => {
    try {
        const decodedToken = jwt.verify(token, secret, options);
        
        // Retrieve hashed ID from id_hash_map if needed
        const hashedEmployeeID = await getHashedIDFromMap(decodedToken.sub, 'employees');
        
        // Compare the hashed employee ID with the one in the token payload
        if (hashedEmployeeID !== decodedToken.sub) {
            throw new Error('Invalid token payload');
        }
        
        return decodedToken;
    } catch (error) {
        console.error('Invalid token:', error);
        return null; // Return null if the token is invalid or expired
    }
};

// Exports the functions for reuse in other parts of the application
module.exports = {
    generateSalt,
    hashID,
    maskID,
    processID,
    processMultipleIDs,
    storeInIdHashMap,
    getHashedIDFromMap,
    validateToken
};