const jwt = require('jsonwebtoken');
const { query } = require("../database/database");
const { processID, storeInIdHashMap, hashID, generateSalt } = require("./idUtils");
const logger = require('../utilities/logger');

// Generates a token (Access or Refresh) with hashed IDs and stores the refresh token if necessary
const generateToken = async (employee, type = 'access') => {
    try {
        // Use a consistent salt for hashing the employee, role and token
        const saltLength = 12;
        const salt = generateSalt(saltLength);
        
        // Process employee ID and role ID
        const employeeHashData = processID(employee.id);
        const roleHashData = processID(employee.role_id);
        
        // Store hashed employee ID and role ID in id_hash_map with correct table_name
        await storeInIdHashMap({ ...employeeHashData, tableName: 'employees', salt });
        await storeInIdHashMap({ ...roleHashData, tableName: 'roles', salt });
        
        const payload = {
            sub: employeeHashData.hashedID,  // Use hashed employee ID
            iat: Math.floor(Date.now() / 1000),
            role: roleHashData.hashedID,  // Use hashed role ID
            aud: process.env.JWT_AUDIENCE,
            iss: process.env.JWT_ISSUER,
        };
        
        let secret;
        let options;
        let expiresAt;
        
        if (type === 'access') {
            secret = process.env.JWT_ACCESS_SECRET;
            options = { expiresIn: '15m' };
            expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
        } else if (type === 'refresh') {
            secret = process.env.JWT_REFRESH_SECRET;
            options = { expiresIn: '7d' };
            expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        } else {
            throw new Error('Invalid token type');
        }
        
        const token = jwt.sign(payload, secret, options);
        
        const hashedToken = hashID(token, salt);
        
        if (type === 'refresh') {
            // Store the hashed token in the tokens table and retrieve the token ID (UUID)
            const tokenId = await storeRefreshToken(employee.id, hashedToken, expiresAt);
            
            // Store the tokenId and hashed token in id_hash_map with expiration date
            await storeInIdHashMap({
                originalID: tokenId,  // UUID of the stored token
                hashedID: hashedToken,
                tableName: 'tokens',
                salt,
                expiresAt,
            });
        }
        
        logger.info(`Token generated for employee ${employee.id} (${type} token)`);
        return hashedToken;  // Return the hashed token
    } catch (error) {
        logger.error('Error generating token:', error);
        throw new Error('Token generation failed');
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

// Validate Token (Access or Refresh)
const validateToken = (token, secret, options = {}) => {
    try {
        const decoded = jwt.verify(token, secret, options);
        logger.info('Token validated successfully');
        return decoded;
    } catch (error) {
        logger.warn('Invalid token:', error);
        return null; // Return null if the token is invalid or expired
    }
};

// Revoke Refresh Token (with hashed token)
const revokeToken = async (token, salt) => {
    const hashedToken = hashID(token, salt);
    try {
        await query(
            'UPDATE tokens SET revoked = TRUE WHERE token = $1',
            [hashedToken]
        );
        logger.info('Token revoked successfully');
    } catch (error) {
        logger.error('Error revoking token:', error);
        throw new Error('Failed to revoke token');
    }
};

// Validate Stored Refresh Token from the Database (with hashed token)
const validateStoredRefreshToken = async (refreshToken) => {
    // Fetch the salt used for this token from the database
    const result = await query('SELECT salt FROM tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()', [refreshToken]);
    
    if (result.length === 0) {
        logger.warn('No valid refresh token found');
        return null;
    }
    
    const { salt } = result[0];
    const hashedToken = hashID(refreshToken, salt);
    
    try {
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
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

module.exports = {
    generateToken,
    validateToken,
    revokeToken,
    validateStoredRefreshToken,
    refreshTokens,
};