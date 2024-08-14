const asyncHandler = require('../../middlewares/asyncHandler');
const { query } = require('../../database/database');
const { logSessionAction } = require('../../utilities/log/auditLogger');
const { errorHandler} = require('../../middlewares/errorHandler');
const {getOriginalId} = require("../getOriginalId");

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
    
    return result;
};

// Get active sessions for the current employee
const getActiveSessions = asyncHandler(async (req, res) => {
    const employeeId = req.employee.id;
    
    const sessions = await query(
        'SELECT id, user_agent, ip_address, created_at, expires_at FROM sessions WHERE employee_id = $1 AND revoked = FALSE AND expires_at > NOW()',
        [employeeId]
    );
    
    res.status(200).json({ sessions });
});

// Revoke a specific session by session ID
const revokeSession = async (sessionId, employeeId, ip, userAgent) => {
    const queryText = 'UPDATE sessions SET revoked = TRUE WHERE id = $1 AND employee_id = $2 RETURNING id';
    const params = [sessionId, employeeId];
    
    const result = await query(queryText, params);
    if (result.length === 0) {
        throw new Error('Session not found or already revoked');
    }
    
    // Log the session revocation
    await logSessionAction(sessionId, employeeId, 'revoked', ip, userAgent);
    
    // Return the session ID or a success message
    return result[0].id;
};

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

// Validate session using token
const validateSession = async (token) => {
    const session = await query(
        'SELECT id, employee_id, user_agent, ip_address, created_at, expires_at FROM sessions WHERE token = $1 AND revoked = FALSE',
        [token]
    );
    
    if (session.length === 0) {
        return null;
    }
    
    const currentSession = session[0];
    
    // Check if the session has expired
    if (new Date(currentSession.expires_at) < new Date()) {
        // Revoke the session if it has expired
        await revokeSessions(currentSession.employee_id, currentSession.id);
        return null;
    }
    
    return currentSession;
};

module.exports = {
    getActiveSessions,
    revokeSession,
    revokeAllSessions,
    validateSession
};