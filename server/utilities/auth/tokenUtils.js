const jwt = require('jsonwebtoken');
const { query } = require("../../database/database");
const { processID, storeInIdHashMap, hashID, generateSalt, getIDFromMap } = require("../idUtils");
const logger = require('../logger');
const { logTokenAction, logAuditAction } = require('../log/auditLogger');
const { createLoginDetails } = require("../log/logDetails");
const {getSessionId} = require("./sessionUtils");

// Generates a token (Access or Refresh) with hashed IDs and stores the refresh token if necessary
const generateToken = async (employee, type = 'access') => {
    if (!employee.id || !employee.role_id) {
        throw new Error('Invalid employee data: Employee ID and Role ID are required');
    }
    
    try {
        // Process employee ID and role ID with consistent hashing
        const employeeHashData = await processID(employee.id, 'employees');
        const roleHashData = await processID(employee.role_id, 'roles');
        
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
            // Hash the token
            const salt = generateSalt();
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
            
            // Log token generation in audit logs
            await logAuditAction('auth', 'tokens', 'create', tokenId, employee.id, null, { tokenType: 'refresh', tokenId });
            
            logger.info(`Refresh token generated and stored for employee ${employee.id}`);
            return hashedToken;  // Return the hashed refresh token
        }
        
        // Log token generation in audit logs
        await logAuditAction('auth', 'tokens', 'create', employee.id, employee.id, null, { tokenType: 'access' });
        
        logger.info(`Access token generated for employee ${employee.id}`);
        return token;  // Return the plain access token
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
        
        // Log refresh token storage in audit logs
        await logAuditAction('auth', 'tokens', 'store', tokenId, originalEmployeeId, null, { hashedToken, expiresAt });
        
        return tokenId;
    } catch (error) {
        logger.error('Error storing refresh token:', error);
        throw new Error('Failed to store refresh token');
    }
};

// Validates an access token by verifying its signature and payload.
const validateAccessToken = async (token) => {
    try {
        // Verify the JWT access token using the secret
        // Return the decoded token if valid
        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        const employeeId = await getIDFromMap(decodedToken.sub, 'employees');
        const sessionId= await getSessionId(token);
        
        // Log successful token validation in audit logs
        await logAuditAction('auth', 'tokens', 'validate', sessionId, employeeId, null, { tokenType: 'access', token });
        
        return decodedToken;
    } catch (error) {
        // Log the specific error for debugging purposes
        logger.error('Invalid access token:', { message: error.message, stack: error.stack });
        return null; // Return null if the token is invalid, expired, or the payload is incorrect
    }
};

// Revoke Refresh Token (with hashed token)
const revokeToken = async (hashedRefreshToken, ipAddress, userAgent) => {
    try {
        const tokenId = await getIDFromMap(hashedRefreshToken, 'tokens');
        
        const result = await query(
            'UPDATE tokens SET revoked = TRUE WHERE token = $1 RETURNING id, employee_id',
            [hashedRefreshToken]
        );
        
        if (result.length === 0) {
            throw new Error('Token not found or already revoked.');
        }
        
        const employeeId = result[0].employee_id;
        const recordId = result[0].id;
        
        logger.info('Token revoked successfully', { employeeId });
        
        // Log token revocation in audit logs
        await logAuditAction('auth', 'tokens', 'revoke', recordId, employeeId, null, { tokenType: 'refresh' });
        
        // Log the token revocation action
        const logDetails = createLoginDetails(userAgent, 'token_revocation', 'Unknown', 'revoke');
        await logTokenAction(employeeId, tokenId, 'refresh', 'revoked', ipAddress, userAgent, logDetails);
    } catch (error) {
        logger.error('Error revoking token:', error);
        throw new Error('Failed to revoke token');
    }
};

// Validate Stored Refresh Token from the Database (with hashed token)
const validateStoredRefreshToken = async (hashedRefreshToken) => {
    try {
        // Directly validate the hashed token against the tokens table
        const validationResult = await query(
            'SELECT * FROM tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
            [hashedRefreshToken]
        );
        
        const {id, employee_id, token_type, created_at, expires_at} = validationResult[0];
        
        if (validationResult.length === 0) {
            logger.warn('Refresh token is invalid, revoked, or expired');
            
            // Log failed refresh token validation in audit logs
            await logAuditAction('auth', 'tokens', 'validate_failed', id, employee_id,
                {tokenType: token_type, created_at, expires_at},
                { tokenType: token_type, reason: 'Invalid, revoked, or expired' });
            
            return null;
        }
        
        // Optional: Log successful validation in audit logs
        await logAuditAction('auth', 'tokens', 'validate', id, employee_id,
            {tokenType: token_type, created_at, expires_at}, { tokenType: 'refresh', hashedRefreshToken });
        
        logger.info('Refresh token validated successfully', { employee_id, expires_at });
        
        return validationResult[0];
    } catch (error) {
        logger.error('Error validating stored refresh token:', error);
        throw new Error('Failed to validate stored refresh token');
    }
};

// Refresh Tokens (Automatically issues new Access and Refresh tokens)
const refreshTokens = async (hashedRefreshToken, ipAddress, userAgent) => {
    const storedToken = await validateStoredRefreshToken(hashedRefreshToken);
    if (!storedToken) {
        logger.warn('Invalid, expired, or revoked refresh token');
        throw new Error('Invalid, expired, or revoked refresh token');
    }
    
    // Ensure that the refresh token has not expired
    if (new Date(storedToken.expires_at) < new Date()) {
        logger.warn('Refresh token has expired');
        throw new Error('Refresh token has expired. Please log in again.');
    }
    
    // Fetch the role ID associated with the employee ID
    const roleQuery = 'SELECT role_id FROM employees WHERE id = $1';
    const roleResult = await query(roleQuery, [storedToken.employee_id]);
    
    if (roleResult.length === 0) {
        throw new Error('Role not found for the employee');
    }
    
    const employee = {
        id: storedToken.employee_id,
        role_id: roleResult[0].role_id
    };
    
    const newAccessToken = await generateToken(employee, 'access');
    const newRefreshToken = await generateToken(employee, 'refresh');
    
    const accessDetails = {
        method: 'auto-refresh',
        timestamp: new Date().toISOString(),
        actionType: 'access_refresh'
    };
    
    const refreshDetails = {
        method: 'auto-refresh',
        timestamp: new Date().toISOString(),
        actionType: 'refresh_refresh'
    };
    
    logger.info('Tokens refreshed successfully');
    const tokenId = await getIDFromMap(newRefreshToken, 'tokens');
    await logTokenAction(employee.id, null, 'access', 'refreshed', ipAddress, userAgent, accessDetails);
    await logTokenAction(employee.id, tokenId, 'refresh', 'refreshed', ipAddress, userAgent, refreshDetails);
    
    // Log token refresh in audit logs
    await logAuditAction('auth', 'tokens', 'refresh', tokenId, employee.id, null, { newAccessToken, newRefreshToken });
    
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        refreshTokenId: tokenId,
    };
};

module.exports = {
    generateToken,
    storeRefreshToken,
    validateAccessToken,
    revokeToken,
    validateStoredRefreshToken,
    refreshTokens,
};