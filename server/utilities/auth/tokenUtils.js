const jwt = require('jsonwebtoken');
const {query, incrementOperations, decrementOperations} = require("../../database/database");
const {processID, storeInIdHashMap, hashID, generateSalt, getIDFromMap} = require("../idUtils");
const logger = require('../logger');
const {logTokenAction, logAuditAction, logSessionAction} = require('../log/auditLogger');
const {createLoginDetails} = require("../log/logDetails");
const {getSessionId, updateSessionWithAccessToken, generateSession, revokeSessions, validateSession} = require("./sessionUtils");
const {TOKEN, SESSION} = require("../constants/timeConfigurations");
const {CustomError} = require("../../middlewares/error/errorHandler");

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
            options = { expiresIn: '15m' };  // 15 minutes for access tokens
            expiresAt = new Date(Date.now() + TOKEN.ACCESS_EXPIRY);
        } else if (type === 'refresh') {
            secret = process.env.JWT_REFRESH_SECRET;
            options = { expiresIn: '7d' };  // 7 days for refresh tokens
            expiresAt = new Date(Date.now() + TOKEN.REFRESH_EXPIRY);
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
            await logAuditAction('auth', 'tokens', 'create', tokenId, employee.id, null, {
                tokenType: 'refresh',
                tokenId
            });
            
            return hashedToken;  // Return the hashed refresh token
        }
        
        // Log token generation in audit logs for access tokens
        await logAuditAction('auth', 'tokens', 'create', employee.id, employee.id, null, { tokenType: 'access' });
        
        return token; // Return the plain access token
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
        
        // Log refresh token storage in audit logs
        await logAuditAction('auth', 'tokens', 'store', tokenId, originalEmployeeId, null, {hashedToken, expiresAt});
        
        return tokenId;
    } catch (error) {
        logger.error('Error storing refresh token:', error);
        throw new Error('Failed to store refresh token');
    }
};

const refreshTokensIfNeeded = async (refreshToken, ipAddress, userAgent, sessionData, accessTokenExpDate) => {
    const refreshResult = await handleTokenRefresh(refreshToken, ipAddress, userAgent, sessionData, accessTokenExpDate);
    let newAccessToken = null;
    let newRefreshToken = null;
    let session_id = null;
    
    if (refreshResult) {
        const { accessToken: refreshedAccessToken, refreshToken: refreshedRefreshToken, session } = refreshResult;
        session_id = session.sessionId;
        // If both new access and refresh tokens are generated
        if (refreshedAccessToken && refreshedRefreshToken) {
            newAccessToken = refreshedAccessToken;
            newRefreshToken = refreshedRefreshToken;
        }
        
        // If only new access token is generated
        else if (refreshedAccessToken && !refreshedRefreshToken) {
            newAccessToken = refreshedAccessToken;
        }
        
        // If only new refresh token is generated
        else if (refreshedRefreshToken && !refreshedAccessToken) {
            newRefreshToken = refreshedRefreshToken;
        }
    }
    
    return { newAccessToken, newRefreshToken, session_id };
};

// Validates an access token by verifying its signature and payload.
const validateAccessToken = async (accessToken, refreshToken, ipAddress, userAgent) => {
    try {
        // Decode the token without verification to check its expiration time
        const decodedToken = jwt.decode(accessToken);
        if (!decodedToken) {
            logger.warn('Access denied. No access token provided.');
            throw new Error('InvalidToken'); // Throw specific error if decoding fails
        }
        
        const { exp } = decodedToken;
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        
        const sessionId = await getSessionId(accessToken);
        const { session } = await validateSession(sessionId);
        const sessionData = { ...session, session_id: sessionId };
        
        // Initialize accessTokenExpDate as early as possible
        const accessTokenExpDate = new Date(exp * 1000).getTime() - TOKEN.ACCESS_RENEWAL_THRESHOLD;
        
        let newAccessToken = accessToken;
        let newRefreshToken = refreshToken;
        let session_id = sessionId;
        
        // Check if the token is already expired (post-expired handling)
        if (exp < currentTime) {
            logger.warn('Access token has expired. Proceeding to refresh.', { exp, currentTime });
            const refreshResult = await refreshTokensIfNeeded(refreshToken, ipAddress, userAgent, sessionData, accessTokenExpDate);
            newAccessToken = refreshResult.newAccessToken || newAccessToken;
            newRefreshToken = refreshResult.newRefreshToken || newRefreshToken;
            session_id = refreshResult.session_id || session_id;
        }
        
        // Check if the token is about to expire (proactive refresh handling)
        else if ((exp - currentTime) * 1000 <= TOKEN.ACCESS_RENEWAL_THRESHOLD) {
            logger.warn('Access token is close to expiring', { exp, currentTime });
            const refreshResult = await refreshTokensIfNeeded(refreshToken, ipAddress, userAgent, sessionData, accessTokenExpDate);
            newAccessToken = refreshResult.newAccessToken || newAccessToken;
            newRefreshToken = refreshResult.newRefreshToken || newRefreshToken;
            session_id = refreshResult.session_id || session_id;
        }
        
        // Verify the JWT access token to ensure signature and integrity
        const verifiedToken = jwt.verify(newAccessToken, process.env.JWT_ACCESS_SECRET);
        const { sub: verifiedSub, role: verifiedRole } = verifiedToken;
        
        // Get employee ID and role ID from the mappings
        const employeeId = await getIDFromMap(verifiedSub, 'employees');
        const roleId = await getIDFromMap(verifiedRole, 'roles');
        
        // Log successful token validation in audit logs
        await logAuditAction('auth', 'tokens', 'validate', session_id, employeeId, newAccessToken, { tokenType: 'access', token: newAccessToken });
        
        // Return the relevant token data if validation is successful
        return { employeeId, roleId, session_id, accessTokenExpDate, newAccessToken, newRefreshToken };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // Handle token expiration specifically
            logger.warn('Access token has expired:', { message: error.message, expiredAt: error.expiredAt });
            
            throw new Error('TokenExpired'); // Throw a specific error for token expiration
        } else if (error.name === 'JsonWebTokenError') {
            // Handle other JWT-related errors, like invalid signature
            logger.error('Invalid access token:', { message: error.message, stack: error.stack });
            
            // Throw a specific error for invalid token
            throw new Error('InvalidToken');
        }
        
        // Log unexpected errors for debugging purposes
        logger.error('Unexpected error during access token validation:', { message: error.message, stack: error.stack });
        
        // Return null for other unknown types of errors
        return null;
    }
};

// Revoke Refresh Token (with hashed token)
const revokeTokens = async (employeeId, hashedRefreshToken = null, ipAddress, userAgent) => {
    try {
        await query('BEGIN'); // Start a transaction
        incrementOperations();
        
        let selectQueryText;
        let selectQueryParams;
        
        // Prepare SELECT query with FOR UPDATE lock
        if (hashedRefreshToken) {
            selectQueryText = `
                SELECT id, revoked, version FROM tokens
                WHERE token = $1 AND employee_id = $2 AND revoked = FALSE FOR UPDATE
            `;
            selectQueryParams = [hashedRefreshToken, employeeId];
        } else {
            selectQueryText = `
                SELECT id, revoked, version FROM tokens
                WHERE employee_id = $1 AND revoked = FALSE FOR UPDATE
            `;
            selectQueryParams = [employeeId];
        }
        
        // Lock the tokens
        const lockedTokens = await query(selectQueryText, selectQueryParams);
        
        if (lockedTokens.length === 0) {
            throw new Error('Token not found or already revoked.');
        }
        
        // Prepare batch update query to revoke the tokens
        const tokenIds = lockedTokens.map(token => token.id);
        const versionNumbers = lockedTokens.map(token => token.version);
        
        const revokeQueryText = `
            UPDATE tokens
            SET revoked = TRUE, version = version + 1
            WHERE id = ANY($1::uuid[]) AND employee_id = $2 AND version = ANY($3)
            RETURNING id, employee_id, revoked, version
        `;
        const revokeQueryParams = [tokenIds, employeeId, versionNumbers];
        
        // Batch update the tokens
        const revokedTokens = await query(revokeQueryText, revokeQueryParams);
        
        // Log the token revocations
        const logAuditPromises = revokedTokens.map((revokedToken, index) => {
            const originalToken = lockedTokens[index];
            
            const tokenId = revokedToken.id;
            const empId = revokedToken.employee_id;
            
            const oldRevoke = originalToken.revoked;
            const oldVersion = originalToken.version;
            const newRevoke = revokedToken.revoked;
            const newVersion = revokedToken.version;
            
            // Log token revocation in audit logs
            return logAuditAction(
                'auth',
                'tokens',
                'revoke',
                tokenId,
                empId,
                { tokenType: 'refresh', revoke: oldRevoke, version: oldVersion },
                { tokenType: 'refresh', revoke: newRevoke, version: newVersion }
            );
        });
        
        // Execute logging in parallel
        await Promise.all(logAuditPromises);
        
        const logTokenPromises = revokedTokens.map(revokedToken => {
            const { id: tokenId, employee_id: empId } = revokedToken;
            
            const logDetails = createLoginDetails(userAgent, 'token_revocation', 'Unknown', 'revoke');
            return logTokenAction(empId, tokenId, 'refresh', 'revoked', ipAddress, userAgent, logDetails);
        });
        
        // Execute logging in parallel
        await Promise.all(logTokenPromises);
        
        // Commit the transaction
        await query('COMMIT');
        
        return revokedTokens;
    } catch (error) {
        await query('ROLLBACK');
        logger.error('Error revoking token:', error);
        throw new Error('Failed to revoke tokens');
    } finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
};

// Validate Stored Refresh Token from the Database (with hashed token)
const validateStoredRefreshToken = async (hashedRefreshToken) => {
    try {
        // Directly validate the hashed token against the tokens table
        const validationResult = await query(
            'SELECT * FROM tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW() FOR UPDATE',
            [hashedRefreshToken]
        );
        
        const {id, employee_id, token_type, created_at, expires_at} = validationResult[0];
        
        if (validationResult.length === 0) {
            logger.warn('Refresh token is invalid, revoked, or expired');
            
            // Log failed refresh token validation in audit logs
            await logAuditAction('auth', 'tokens', 'validate_failed', id, employee_id,
                {tokenType: token_type, created_at, expires_at},
                {tokenType: token_type, reason: 'Invalid, revoked, or expired'});
            
            return null;
        }
        
        // Optional: Log successful validation in audit logs
        await logAuditAction('auth', 'tokens', 'validate', id, employee_id,
            {tokenType: token_type, created_at, expires_at}, {tokenType: 'refresh', hashedRefreshToken});
        
        return validationResult[0];
    } catch (error) {
        logger.error('Error validating stored refresh token:', error);
        throw new Error('Failed to validate stored refresh token');
    }
};

// Refresh Tokens (Automatically issues new Access and Refresh tokens)
const handleTokenRefresh = async (hashedRefreshToken, ipAddress, userAgent, session, accessTokenExpDate) => {
    try {
        // Start a transaction
        await query('BEGIN');
        incrementOperations();
        
        // Validate the stored refresh token
        const storedToken = await validateStoredRefreshToken(hashedRefreshToken);
        if (!storedToken && !session) {
            logger.warn('Both refresh token and session are invalid, expired, or revoked');
            throw new CustomError(401, 'Both refresh token and session are invalid, expired, or revoked');
        } else if (!storedToken) {
            logger.warn('Invalid, expired, or revoked refresh token');
            throw new CustomError(401, 'Invalid, expired, or revoked refresh token');
        } else if (!session) {
            logger.warn('Session is invalid, expired, or not found');
            throw new CustomError(401, 'Session is invalid, expired, or not found');
        }
        
        // Check if refresh token itself is expired
        const currentDateTime = new Date();
        const refreshTokenExpiryDate = new Date(storedToken.expires_at);
        
        // Check if the refresh token itself is expired
        if (refreshTokenExpiryDate < currentDateTime) {
            logger.warn('Refresh token has expired', {context: 'auth', employeeId: storedToken.employee_id});
            throw new Error('Refresh token has expired. Please log in again.');
        }
        
        // Check if access token is expired
        const accessTokenExpired = accessTokenExpDate < currentDateTime;
        
        // Check if session is expired
        const sessionExpiryDate = new Date(session.expires_at).getTime() - SESSION.RENEWAL_THRESHOLD;
        const sessionExpired = sessionExpiryDate < currentDateTime;
        
        // Check the employee's latest session expiration date
        const latestSessionQuery = 'SELECT expires_at FROM sessions WHERE employee_id = $1 ORDER BY expires_at DESC LIMIT 1';
        const latestSessionResult = await query(latestSessionQuery, [storedToken.employee_id]);
        const latestSessionExpiryDate = new Date(latestSessionResult[0].expires_at);
        
        // Determine if a new refresh token is needed
        const refreshTokenCloseToExpiry = (refreshTokenExpiryDate - currentDateTime) < TOKEN.REFRESH_RENEWAL_THRESHOLD; // 4 hours in milliseconds
        
        const roleQuery = 'SELECT role_id FROM employees WHERE id = $1';
        const roleResult = await query(roleQuery, [storedToken.employee_id]);
        
        if (roleResult.length === 0) {
            throw new Error('Role not found for the employee');
        }
        
        const employee = {
            id: storedToken.employee_id,
            role_id: roleResult[0].role_id
        };
        
        // Initialize variables for tokens
        let newAccessToken, newRefreshToken, newSession;
        
        // Scenario 1: Access token expired, session not expired, refresh token valid
        if (accessTokenExpired && !sessionExpired) {
            logger.warn('Access token expired');
            newAccessToken = await generateToken(employee, 'access');
            await updateSessionWithAccessToken(session.session_id, newAccessToken, false);
            logger.info('Generate new access token');
        }
        
        // Scenario 2: Session expired, refresh token valid
        if (sessionExpired) {
            logger.warn('Session expired');
            await updateSessionWithAccessToken(session.session_id, session.token);
            logger.info('Session get updated');
        }
        
        // Scenario 3: Both access token and session expired, refresh token valid
        if (accessTokenExpired && sessionExpired) {
            logger.warn('Both access token and session expired');
            
            // Generate new access and refresh tokens
            newAccessToken = await generateToken(employee, 'access');
            newRefreshToken = await generateToken(employee, 'refresh');
            
            // Create a new session with the new access token
            newSession = await generateSession(employee.id, newAccessToken, userAgent, ipAddress);
            
            // Revoke the expired session
            await revokeSessions(employee.id, session.session_id);
            
            logger.info('New session and tokens generated');
        }
        
        // Regenerate refresh token if it is close to expiry and latest session is not expired
        if (refreshTokenCloseToExpiry && latestSessionExpiryDate > currentDateTime) {
            newRefreshToken = await generateToken(employee, 'refresh');
            await revokeTokens(employee.id, hashedRefreshToken, ipAddress, userAgent);
        }
        
        const tokenId = newRefreshToken ? await getIDFromMap(newRefreshToken, 'tokens') : storedToken.id;
        
        // Log token actions
        if (newAccessToken) {
            await logSessionAction(session.session_id, employee.id, 'auto_generate_access_token', ipAddress, userAgent);
        }
        
        if (newSession) {
            await logSessionAction(newSession.sessionId, employee.id, 'auto_generate_session', ipAddress, userAgent);
        }
        
        if (newRefreshToken) {
            const refreshDetails = {
                method: 'auto-refresh',
                timestamp: new Date().toISOString(),
                actionType: 'refresh_refresh'
            };
            await logTokenAction(employee.id, tokenId, 'refresh', 'auto_generate_refresh_token', ipAddress, userAgent, refreshDetails);
        }
        
        // Commit the transaction
        await query('COMMIT');
        
        // Log token refresh in audit logs
        await logAuditAction('auth', 'tokens', 'refresh', tokenId, employee.id, null, {newAccessToken, newRefreshToken});
        
        // Return only the relevant tokens and session data
        if (newAccessToken && newRefreshToken && newSession) {
            return { accessToken: newAccessToken, refreshToken: newRefreshToken, session: newSession, refreshTokenId: tokenId };
        } else if (newAccessToken && newRefreshToken) {
            return { accessToken: newAccessToken, refreshToken: newRefreshToken, refreshTokenId: tokenId };
        } else if (newRefreshToken) {
            return { refreshToken: newRefreshToken, refreshTokenId: tokenId };
        } else if (newSession) {
            // If both access token and session expired, return the new session
            return { session_id: newSession.sessionId, refreshTokenId: tokenId };
        }
        
        // If no new tokens are generated, return the existing hashed refresh token and access token
        return {hashedRefreshToken, accessToken: session.token};
    } catch (error) {
        await query('ROLLBACK');
        logger.error('Error during token refresh:', error.message);
        throw error;
    } finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
};

module.exports = {
    generateToken,
    storeRefreshToken,
    validateAccessToken,
    revokeTokens,
    validateStoredRefreshToken,
    handleTokenRefresh,
};