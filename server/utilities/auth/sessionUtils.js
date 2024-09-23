const {query, incrementOperations, decrementOperations} = require('../../database/database');
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
        
        // Insert a new session or update the existing one if the token already exists
        const sessionResult = await query(`
            INSERT INTO sessions (employee_id, token, user_agent, ip_address, expires_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (token) DO UPDATE
            SET expires_at = EXCLUDED.expires_at
            RETURNING id, expires_at
            `, [employeeId, accessToken, userAgent, ipAddress, expiresAt]
        );
        
        // Check if a session ID was returned
        if (sessionResult.length === 0) {
            throw new Error('Failed to create or update session.');
        }
        
        const { id, expires_at } = sessionResult[0];
        
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
        
        return { sessionId: id, hashedSessionId: hashedID };
    } catch (error) {
        logger.error('Error generating session:', error.message);
        throw error; // Propagate the error for further handling
    }
};

// Utility function to revoke sessions
const revokeSessions = async (employeeId, sessionId = null) => {
    try {
        await query('BEGIN'); // Start a transaction
        incrementOperations();
        
        let queryText, params;
        
        // Query to fetch the sessions that need to be revoked
        if (sessionId) {
            queryText = 'SELECT id, user_agent, ip_address, version FROM sessions WHERE id = $1 AND employee_id = $2 AND revoked = FALSE';
            params = [sessionId, employeeId];
        } else {
            queryText = 'SELECT id, user_agent, ip_address, version FROM sessions WHERE employee_id = $1 AND revoked = FALSE';
            params = [employeeId];
        }
       
        const currentSessions = await query(queryText, params);
        
        if (currentSessions.length === 0 && sessionId) {
            throw errorHandler(401, 'Session not found or already revoked');
        }
        
        // Use batch update to revoke all sessions in one go
        const sessionIds = currentSessions.map(session => session.id);
        const versionNumbers = currentSessions.map(session => session.version);
        
        const batchUpdateQueryText = `
            UPDATE sessions
            SET revoked = TRUE, version = version + 1
            WHERE id = ANY($1) AND employee_id = $2 AND version = ANY($3)
            RETURNING id, user_agent, ip_address, revoked;
        `;
        const updateParams = [sessionIds, employeeId, versionNumbers];
        const updateResults = await query(batchUpdateQueryText, updateParams);
        
        // Log session actions using logSessionAction function
        const logSessionPromises = updateResults.map(session => {
            const { id, user_agent, ip_address } = session;
            return logSessionAction(id, employeeId, 'revoked', ip_address, user_agent);
        });
        
        await Promise.all(logSessionPromises);  // Await all session log actions in parallel
        
        // Log audit actions in parallel with batch inserts
        const auditLogPromises = updateResults.map(session => {
            const { id, user_agent, ip_address, revoked } = session;
            
            return logAuditAction(
                'auth',
                'sessions',
                'revoke',
                id,
                employeeId,
                { oldSessionId: sessionId },
                { userAgent: user_agent, ipAddress: ip_address, revoked: revoked }
            );
        });
        
        await Promise.all(auditLogPromises);  // Await all audit log actions in parallel
        
        // Commit the transaction
        await query('COMMIT');
        
        return updateResults;
    } catch (error) {
        await query('ROLLBACK');  // Roll back the transaction in case of an error
        logger.error('Error revoking sessions:', error);
        throw new Error('Failed to revoke sessions');
    } finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
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
const updateSessionWithAccessToken = async (sessionId, accessToken, extendIfCloseToExpiry = true) => {
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
            const extensionThreshold = SESSION.RENEWAL_THRESHOLD; // 5 minutes in milliseconds
            if (timeToExpiration < extensionThreshold) {
                newExpirationTime = new Date(Date.now() + SESSION.EXPIRY); // Extend by 30 minutes
            }
        }
        
        // Update the session with the new access token and potentially the new expiration time
        const queryText = `
            UPDATE sessions
            SET token = $1, expires_at = $3, version = version + 1
            WHERE id = $2 AND version = $4
            RETURNING id, employee_id
        `;
        const queryParams = [accessToken, sessionId, newExpirationTime, version];
        
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
            newAccessToken: accessToken
        }, {newAccessToken: accessToken, newExpirationTime});
        
        return result[0];
    } catch (error) {
        logger.error('Error updating session with new access token:', error);
        throw error;
    }
};

// Validate session using token
const validateSession = async (sessionId) => {
    try {
        if (!sessionId) {
            logger.error('Session validation failed: No access token provided');
            return {session: null, sessionExpired: false, sessionAboutToExpire: false};
        }
        
        // Query the session from the database
        const sessionResult = await query(
            'SELECT employee_id, token, user_agent, ip_address, created_at, expires_at FROM sessions WHERE id = $1 AND revoked = FALSE',
            [sessionId]
        );
        
        // If no session is found, return null
        if (sessionResult.length === 0) {
            logger.warn('Session not found or already revoked', {sessionId: sessionId});
            return {session: null, sessionExpired: false, sessionAboutToExpire: false};
        }
        
        const currentSession = sessionResult[0];
        const now = new Date();
        const sessionExpiryDate = new Date(currentSession.expires_at);
        const sessionExpiryThreshold = new Date(sessionExpiryDate.getTime() - SESSION.RENEWAL_THRESHOLD);
        
        // Check if the session is about to expire (within the threshold)
        const sessionAboutToExpire = now >= sessionExpiryThreshold && now < sessionExpiryDate;
        
        if (sessionAboutToExpire) {
            logger.warn('Session is about to expire', {
                sessionId,
                employeeId: currentSession.employee_id,
                expiresAt: currentSession.expires_at
            });
            
            // Log session expiration and revocation in audit logs
            await logAuditAction('auth', 'sessions', 'about_to_expire', sessionId, currentSession.employee_id, {session_id: sessionId, expiredAt: currentSession.expires_at});
            
            return {session: currentSession, sessionExpired: false, sessionAboutToExpire: true};
        }
        
        // Check if the session has expired
        if (sessionExpiryDate < now) {
            logger.info('Session expired', {
                sessionId,
                employeeId: currentSession.employee_id,
                ip: currentSession.ip_address,
                userAgent: currentSession.user_agent,
                expiredAt: currentSession.expires_at
            });
            
            // Log session expiration and revocation in audit logs
            await logAuditAction('auth', 'sessions', 'expire_and_revoke', id, currentSession.employee_id, id, {expiredAt: currentSession.expires_at});
            
            return {session: null, sessionExpired: true, sessionAboutToExpire: false};
        }
        
        // Log session validation success in audit logs
        await logAuditAction('auth', 'sessions', 'validate', sessionId, currentSession.employee_id, currentSession, currentSession);
        
        // If the session is valid, return it along with sessionExpired set to false
        return {session: currentSession, sessionExpired: false, sessionAboutToExpire: false};
    } catch (error) {
        logger.error('Error validating session', {error: error.message});
        throw new Error('Failed to validate session');
    }
};

module.exports = {
    generateSession,
    getSessionId,
    revokeSessions,
    updateSessionWithAccessToken,
    validateSession
};