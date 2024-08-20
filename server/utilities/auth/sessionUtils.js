const asyncHandler = require('../../middlewares/asyncHandler');
const { query } = require('../../database/database');
const { logSessionAction, logAuditAction } = require('../../utilities/log/auditLogger');
const { errorHandler } = require('../../middlewares/errorHandler');
const logger = require('../logger');

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
    
    // Log each session revocation in audit logs
    const logPromises = result.map(session =>
        logAuditAction('auth', 'sessions', 'revoke', session.id, employeeId, sessionId, { userAgent: session.user_agent, ipAddress: session.ip_address, revoked: session.revoked })
    );
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
            logger.warn('No valid session found for the given access token', { accessToken });
            return null;
        }
        
        // Log session retrieval in audit logs
        await logAuditAction('auth', 'sessions', 'retrieve', result[0].id, result[0].employee_id, null, { accessToken });
        
        return result[0].id;
    } catch (error) {
        logger.error('Error retrieving session ID from database:', { accessToken, error: error.message });
        throw new Error('Failed to retrieve session ID from database');
    }
};

// Revoke a specific session by session ID
const revokeSession = async (sessionId, employeeId, ip, userAgent) => {
    const queryText = 'UPDATE sessions SET revoked = TRUE WHERE id = $1 AND employee_id = $2 RETURNING id';
    const params = [sessionId, employeeId];
    
    const result = await query(queryText, params);
    if (result.length === 0) {
        throw new Error('Session not found or already revoked');
    }
    
    // Log the session revocation in audit logs
    await logAuditAction('auth', 'sessions', 'revoke', sessionId, employeeId, null, { ip, userAgent });
    
    // Log the session revocation action
    await logSessionAction(sessionId, employeeId, 'revoked', ip, userAgent);
    
    // Return the session ID or a success message
    return result[0].id;
};

// todo implement this function and modified
// Revoke all sessions for the current employee
const revokeAllSessions = asyncHandler(async (req, res) => {
    const employeeId = req.employee.id;
    
    const revokedSessions = await revokeSessions(employeeId);
    
    // Batch log the revocation of all sessions
    const logPromises = revokedSessions.map(session =>
        logSessionAction(session.id, employeeId, 'revoked', req.ip, req.get('User-Agent'))
    );
    await Promise.all(logPromises);
    
    res.status(200).json({ message: 'All sessions revoked successfully', revokedSessionIds: revokedSessions.map(session => session.id) });
});

// Update new access token using session id and extend expiration time
const updateSessionWithNewAccessToken = async (sessionId, newAccessToken, extendIfCloseToExpiry = true) => {
    try {
        // Fetch the current session data
        const session = await query(
            'SELECT expires_at FROM sessions WHERE id = $1',
            [sessionId]
        );
        
        if (session.length === 0) {
            throw new Error('Session not found');
        }
        
        const currentExpirationTime = new Date(session[0].expires_at);
        let newExpirationTime = currentExpirationTime;
        
        // Check if the session is close to expiring and extend it if needed
        if (extendIfCloseToExpiry) {
            const timeToExpiration = currentExpirationTime - Date.now();
            
            // If the session is close to expiring (e.g., within 5 minutes), extend it
            const extensionThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
            if (timeToExpiration < extensionThreshold) {
                newExpirationTime = new Date(Date.now() + 30 * 60 * 1000); // Extend by 30 minutes
            }
        }
        
        // Update the session with the new access token and potentially the new expiration time
        const queryText = `
            UPDATE sessions
            SET token = $1, expires_at = $3
            WHERE id = $2
            RETURNING employee_id
        `;
        const queryParams = [newAccessToken, sessionId, newExpirationTime];
        
        const result = await query(queryText, queryParams);
        
        if (result.rowCount === 0) {
            throw new Error('Failed to update session with new access token');
        }
        
        logger.info('Session updated successfully with new access token', {
            sessionId,
            newExpirationTime
        });
        
        // Log session update in audit logs
        await logAuditAction('auth', 'sessions', 'update', sessionId, result[0].employee_id, null, { newAccessToken, newExpirationTime });
    } catch (error) {
        logger.error('Error updating session with new access token:', error);
        throw error;
    }
};

// Validate session using token
const validateSession = async (accessToken) => {
    try {
        if (!accessToken) {
            logger.warn('Session validation failed: No access token provided');
            return { session: null, sessionExpired: false };
        }
        
        // Query the session from the database
        const sessionResult = await query(
            'SELECT id, employee_id, user_agent, ip_address, created_at, expires_at FROM sessions WHERE token = $1 AND revoked = FALSE',
            [accessToken]
        );
        
        // If no session is found, return null
        if (sessionResult.length === 0) {
            logger.warn('Session not found or already revoked', { accessToken });
            return { session: null, sessionExpired: false };
        }
        
        const currentSession = sessionResult[0];
        
        // Check if the session has expired
        const now = new Date();
        if (new Date(currentSession.expires_at) < now) {
            // Revoke the session if it has expired
            await revokeSession(currentSession.employee_id, currentSession.id, currentSession.ip_address, currentSession.user_agent);
            
            logger.info('Session expired and revoked', {
                sessionId: currentSession.id,
                employeeId: currentSession.employee_id,
                ip: currentSession.ip_address,
                userAgent: currentSession.user_agent,
                expiredAt: currentSession.expires_at
            });
            
            // Log session expiration and revocation in audit logs
            await logAuditAction('auth', 'sessions', 'expire_and_revoke', currentSession.id, currentSession.employee_id, null, { expiredAt: currentSession.expires_at });
            
            return { session: null, sessionExpired: true };
        }
        
        // Log session validation success in audit logs
        await logAuditAction('auth', 'sessions', 'validate', currentSession.id, currentSession.employee_id, null, { accessToken });
        
        // If the session is valid, return it along with sessionExpired set to false
        return { session: currentSession, sessionExpired: false };
    } catch (error) {
        logger.error('Error validating session', { error: error.message });
        throw new Error('Failed to validate session');
    }
};

module.exports = {
    getSessionId,
    revokeSession,
    revokeAllSessions,
    updateSessionWithNewAccessToken,
    validateSession
};