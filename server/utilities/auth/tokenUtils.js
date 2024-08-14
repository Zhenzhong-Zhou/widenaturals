const jwt = require('jsonwebtoken');
const { query, incrementOperations, decrementOperations} = require("../../database/database");
const { processID, storeInIdHashMap, hashID, generateSalt, getHashedIDFromMap} = require("../idUtils");
const logger = require('../logger');
const { logTokenAction } = require('../log/auditLogger');

// Generates a token (Access or Refresh) with hashed IDs and stores the refresh token if necessary
const generateToken = async (employee, type = 'access') => {
    // Increment the counter before starting the operation
    incrementOperations();
    
    try {
        // Use a consistent salt for hashing the employee, role, and token
        const salt = generateSalt();
        
        // Process employee ID and role ID
        const employeeHashData = processID(employee.id);
        const roleHashData = processID(employee.role_id);
        
        // Store hashed employee ID and role ID in id_hash_map with correct table_name
        await storeInIdHashMap({ ...employeeHashData, tableName: 'employees', salt });
        await storeInIdHashMap({ ...roleHashData, tableName: 'roles', salt });
        
        const payload = {
            sub: employeeHashData.hashedID,
            iat: Math.floor(Date.now() / 1000),
            role: roleHashData.hashedID,
            aud: process.env.JWT_AUDIENCE,
            iss: process.env.JWT_ISSUER,
        };
        
        let secret;
        let options;
        let expiresAt;
        
        if (type === 'access') {
            secret = process.env.JWT_ACCESS_SECRET;
            options = { expiresIn: '15m' };
            expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        } else if (type === 'refresh') {
            secret = process.env.JWT_REFRESH_SECRET;
            options = { expiresIn: '7d' };
            expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        } else {
            throw new Error('Invalid token type');
        }
        
        const token = jwt.sign(payload, secret, options);
        
        if (type === 'refresh') {
            // Hash the refresh token
            const hashedToken = hashID(token, salt);
            
            // Store the hashed token in the tokens table and retrieve the token ID (UUID)
            const tokenId = await storeRefreshToken(employee.id, hashedToken, expiresAt);
            
            // Store the tokenId and hashed token in id_hash_map with expiration date
            await storeInIdHashMap({
                originalID: tokenId,
                hashedID: hashedToken,
                tableName: 'tokens',
                salt,
                expiresAt,
            });
            
            logger.info(`Refresh token generated and stored for employee ${employee.id}`);
            return hashedToken;  // Return the hashed refresh token
        }
        
        logger.info(`Access token generated for employee ${employee.id}`);
        return token;  // Return the plain access token
    } catch (error) {
        logger.error('Error generating token:', error);
        throw new Error('Token generation failed');
    } finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
};

// Store Refresh Token in the Database (with hashed employee ID and hashed token)
const storeRefreshToken = async (originalEmployeeId, hashedToken, expiresAt) => {
    try {
        const result = await query(
            'INSERT INTO tokens (employee_id, token, token_type, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
            [originalEmployeeId, hashedToken, 'refresh', expiresAt]
        );
        const tokenId = result[0].id;
        logger.info(`Refresh token stored for employee ${originalEmployeeId}`);
        return tokenId;
    } catch (error) {
        logger.error('Error storing refresh token:', error);
        throw new Error('Failed to store refresh token');
    }
};

// Validates an access token by verifying its signature and payload.
const validateAccessToken = async (token) => {
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        // Validate the token’s payload, e.g., check against id_hash_map if needed
        const hashedEmployeeID = await getHashedIDFromMap(decodedToken.sub, 'employees', true);
        if (hashedEmployeeID !== decodedToken.sub) {
            throw new Error('Invalid access token payload');
        }
        
        return decodedToken;
    } catch (error) {
        logger.error('Invalid access token:', error);
        return null; // Return null if the token is invalid or expired
    }
};

// Function to get the hashed refresh token from the database
const getStoredHashedTokenFromDatabase = async (employeeId) => {
    try {
        // Query the tokens table to find the hashed token for the given employee ID
        const result = await query(
            `SELECT hashed_token FROM tokens WHERE employee_id = $1 AND expires_at > NOW()`,
            [employeeId]
        );
        
        if (result.length === 0) {
            throw new Error('No valid refresh token found');
        }
        
        return result[0].token;
    } catch (error) {
        logger.error('Error retrieving hashed token from database:', error);
        throw error;
    }
};

// Validates a refresh token by verifying its signature and payload.
const validateRefreshToken = async (receivedToken, salt) => {
    try {
        // Hash the received token using the same salt
        const hashedToken = hashID(receivedToken, salt);
        
        // Retrieve the stored hashed token from the database
        const storedHashedToken = await getStoredHashedTokenFromDatabase();
        
        // Compare the hashed versions
        if (hashedToken !== storedHashedToken) {
            throw new Error('Invalid refresh token');
        }
        
        // If the token matches, verify the original token using jwt.verify
        return jwt.verify(receivedToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        logger.error('Invalid refresh token:', error);
        return null;
    }
};

// Revoke Refresh Token (with hashed token)
const revokeToken = async (token, salt) => {
    const hashedToken = hashID(token, salt);
    try {
        const result = await query(
            'UPDATE tokens SET revoked = TRUE WHERE token = $1 RETURNING employee_id',
            [hashedToken]
        );
        
        if (result.length === 0) {
            throw new Error('Token not found or already revoked.');
        }
        
        const employeeId = result[0].employee_id;
        logger.info('Token revoked successfully', {employeeId});
        
        // Log the token action with the correct employee ID
        await logTokenAction(employeeId, 'refresh', 'revoked', { token });
    } catch (error) {
        logger.error('Error revoking token:', error);
        throw new Error('Failed to revoke token');
    }
};

// Validate Stored Refresh Token from the Database (with hashed token)
const validateStoredRefreshToken = async (refreshToken) => {
    // Fetch the salt associated with the refresh token from the id_hash map
    const result = await query('SELECT salt FROM id_hash_map WHERE hashed_id = $1', [refreshToken]);
    
    if (result.length === 0) {
        logger.warn('No valid salt found for the provided refresh token');
        return null;
    }
    
    const { salt } = result[0];
    const hashedToken = hashID(refreshToken, salt);
    
    try {
        // Now validate the hashed token against the tokens table
        const validationResult = await query(
            'SELECT * FROM tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
            [hashedToken]
        );
        logger.info('Refresh token validated successfully');
        return validationResult.length > 0 ? validationResult[0] : null;
    } catch (error) {
        logger.error('Error validating stored refresh token:', error);
        throw new Error('Failed to validate stored refresh token');
    }
};

// Refresh Tokens (Automatically issues new Access and Refresh tokens)
const refreshTokens = async (refreshToken) => {
    const storedToken = await validateStoredRefreshToken(refreshToken);
    if (!storedToken) {
        logger.warn('Invalid or revoked refresh token');
        throw new Error('Invalid or revoked refresh token');
    }
    
    const employee = { id: storedToken.employee_id }; // This should be the hashed ID
    const newAccessToken = await generateToken(employee, 'access');
    const newRefreshToken = await generateToken(employee, 'refresh');
    
    logger.info('Tokens refreshed successfully');
    await logTokenAction(employee.id, 'access', 'refreshed');
    await logTokenAction(employee.id, 'refresh', 'refreshed');
    
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

module.exports = {
    generateToken,
    storeRefreshToken,
    validateAccessToken,
    validateRefreshToken,
    revokeToken,
    validateStoredRefreshToken,
    refreshTokens,
};