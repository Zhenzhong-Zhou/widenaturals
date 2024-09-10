const {query} = require('../../database/database');
const {generateSalt, hashID, storeInIdHashMap} = require("../idUtils");
const {logSessionAction, logAuditAction} = require('../../utilities/log/auditLogger');
const {errorHandler} = require('../../middlewares/error/errorHandler');
const logger = require('../logger');
const {SESSION} = require("../constants/timeConfigurations");

/**
 * Generates a new session for a given employee and stores it in the database.
 *
 * @param {string} employeeId - The ID of the employee.
 * @param {string} accessToken - The access token associated with the session.
 * @param {string} userAgent - The user agent string of the client's browser.
 * @param {string} ipAddress - The IP address of the client.
 * @returns {Promise<{sessionId: *, hashedSessionId: string}>} An object containing the session ID and hashed ID.
 */
const generateSession = async (employeeId, accessToken, userAgent, ipAddress) => {
    try {
        const expiresAt = new Date(Date.now() + SESSION.EXPIRY);
        // Insert a new session into the database and return the session ID
        const sessionResult = await query(`
            INSERT INTO sessions (employee_id, token, user_agent, ip_address, expires_at)
            VALUES ($1, $2, $3, $4, $5) RETURNING id
            `, [employeeId, accessToken, userAgent, ipAddress, expiresAt]
        );
        
        // Check if a session ID was returned
        if (sessionResult.length === 0) {
            throw new Error('Failed to create session.');
        }
        
        const {id, expires_at} = sessionResult[0];
        
        // Hash the session ID with generated salt
        const salt = generateSalt();
        const hashedID = hashID(id, salt);
        
        // Store the hashed session ID in the id_hash_map
        await storeInIdHashMap({
            originalID: id,
            hashedID,
            tableName: 'sessions',
            salt,
            expiresAt: expires_at
        });
        
        return {sessionId: id, hashedSessionId: hashedID};
    } catch (error) {
        logger.error('Error generating session:', error.message);
        throw error; // Propagate the error for further handling
    }
};

// Utility function to revoke sessions
const revokeSessions = async (employeeId, sessionId = null) => {
    const queryText = sessionId
        ? 'UPDATE sessions SET revoked = TRUE WHERE id = $1 AND employee_id = $2 RETURNING id, user_agent, ip_address, revoked'
        : 'UPDATE sessions SET revoked = TRUE WHERE employee_id = $1 RETURNING id, user_agent, ip_address, revoked';
    
    const params = sessionId ? [sessionId, employeeId] : [employeeId];
    
    const result = await query(queryText, params);
    
    if (result.length === 0 && sessionId) {
        errorHandler(401, 'Session not found or already revoked');
    }
    
    // Loop through each session in the result and log both audit and session actions
    const logPromises = result.map(session => {
        const {id, user_agent, ip_address, revoked} = session;
        
        // Log audit action for session revocation
        const auditLogPromise = logAuditAction(
            'auth',
            'sessions',
            'revoke',
            id,
            employeeId,
            {oldSessionId: sessionId},
            { userAgent: user_agent, ipAddress: ip_address, revoked: revoked }
        );
        
        // Log session action for session revocation
        const sessionLogPromise = logSessionAction(
            id,
            employeeId,
            'revoked',
            ip_address,
            user_agent
        );
        
        // Return both promises to be executed in parallel
        return Promise.all([auditLogPromise, sessionLogPromise]);
    });
    
    // Await all log promises
    await Promise.all(logPromises);
    
    return result;
};

// Get session id from database using access token
const getSessionId = async (accessToken) => {
    // Check if accessToken is provided
    if (!accessToken) {
        logger.warn('Access token is missing');
        throw new Error('Access token is required to retrieve the session ID');
    }
    
    try {
        // Query the sessions table to find the session ID using the access token
        const result = await query(
            'SELECT id, employee_id FROM sessions WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
            [accessToken]
        );
        
        if (result.length === 0) {
            logger.warn('No valid session found for the given access token', {accessToken});
            return null;
        }
        
        // Log session retrieval in audit logs
        await logAuditAction('auth', 'sessions', 'retrieve', result[0].id, result[0].employee_id, null, {accessToken});
        
        return result[0].id;
    } catch (error) {
        logger.error('Error retrieving session ID from database:', {accessToken, error: error.message});
        throw new Error('Failed to retrieve session ID from database');
    }
};

// Update new access token using session id and extend expiration time
const updateSessionWithNewAccessToken = async (sessionId, newAccessToken, extendIfCloseToExpiry = true) => {
    try {
        // Fetch the current session data including the version
        const sessionResult = await query(
            'SELECT expires_at, employee_id, version FROM sessions WHERE id = $1 FOR UPDATE',
            [sessionId]
        );
        
        if (sessionResult.length === 0) {
            throw new Error('Session not found');
        }
        
        const { employee_id, expires_at, version } = sessionResult[0];
        const currentExpirationTime = new Date(expires_at);
        let newExpirationTime = currentExpirationTime;
        
        // Check if the session is close to expiring and extend it if needed
        if (extendIfCloseToExpiry) {
            const timeToExpiration = currentExpirationTime - Date.now();
            
            // If the session is close to expiring (e.g., within 5 minutes), extend it
            const extensionThreshold = SESSION.EXTEND_THRESHOLD; // 5 minutes in milliseconds
            if (timeToExpiration < extensionThreshold) {
                newExpirationTime = new Date(Date.now() + SESSION.EXPIRY); // Extend by 30 minutes
            }
        }
        
        // Update the session with the new access token and potentially the new expiration time
        const queryText = `
            UPDATE sessions
            SET token = $1, expires_at = $3, version = version + 1
            WHERE id = $2 AND version = $4
            RETURNING employee_id
        `;
        const queryParams = [newAccessToken, sessionId, newExpirationTime, version];
        
        const result = await query(queryText, queryParams);
        
        if (result.rowCount === 0) {
            throw new Error('Failed to update session with new access token');
        }
        
        logger.info('Session updated successfully with new access token', {
            sessionId,
            newExpirationTime
        });
        
        // Log session update in audit logs
        await logAuditAction('auth', 'sessions', 'update', sessionId, employee_id, {
            sessionId,
            newAccessToken
        }, {newAccessToken, newExpirationTime});
    } catch (error) {
        logger.error('Error updating session with new access token:', error);
        throw error;
    }
};

// Validate session using token
const validateSession = async (sessionId) => {
    try {
        if (!sessionId) {
            logger.warn('Session validation failed: No access token provided');
            return {session: null, sessionExpired: false};
        }
        
        // Query the session from the database
        const sessionResult = await query(
            'SELECT employee_id, token, user_agent, ip_address, created_at, expires_at FROM sessions WHERE id = $1 AND revoked = FALSE',
            [sessionId]
        );
        
        // If no session is found, return null
        if (sessionResult.length === 0) {
            logger.warn('Session not found or already revoked', {sessionId: sessionId});
            return {session: null, sessionExpired: false};
        }
        
        const currentSession = sessionResult[0];
        
        // Check if the session has expired
        const now = new Date();
        if (new Date(currentSession.expires_at) < now) {
            // Revoke the session if it has expired
            const {id} = await revokeSession(currentSession.employee_id, sessionId, currentSession.ip_address, currentSession.user_agent);
            
            logger.info('Session expired and revoked', {
                sessionId: id,
                employeeId: currentSession.employee_id,
                ip: currentSession.ip_address,
                userAgent: currentSession.user_agent,
                expiredAt: currentSession.expires_at
            });
            
            // Log session expiration and revocation in audit logs
            await logAuditAction('auth', 'sessions', 'expire_and_revoke', id, currentSession.employee_id, id, {expiredAt: currentSession.expires_at});
            
            return {session: null, sessionExpired: true};
        }
        
        // Log session validation success in audit logs
        await logAuditAction('auth', 'sessions', 'validate', sessionId, currentSession.employee_id, currentSession, currentSession);
        
        // If the session is valid, return it along with sessionExpired set to false
        return {session: currentSession, sessionExpired: false};
    } catch (error) {
        logger.error('Error validating session', {error: error.message});
        throw new Error('Failed to validate session');
    }
};

module.exports = {
    generateSession,
    getSessionId,
    revokeSessions,
    updateSessionWithNewAccessToken,
    validateSession
};