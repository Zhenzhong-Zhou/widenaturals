const asyncHandler = require('../../middlewares/asyncHandler');
const {query} = require('../../database/database');
const {logSessionAction} = require('../../utilities/log/auditLogger');

// Utility function to revoke sessions
const revokeSessions = async (employeeId, sessionId = null) => {
    const queryText = sessionId
        ? 'UPDATE sessions SET revoked = TRUE WHERE id = $1 AND employee_id = $2 RETURNING *'
        : 'UPDATE sessions SET revoked = TRUE WHERE employee_id = $1 RETURNING *';
    
    const params = sessionId ? [sessionId, employeeId] : [employeeId];
    
    const result = await query(queryText, params);
    
    if (result.length === 0 && sessionId) {
        throw new Error('Session not found or already revoked');
    }
    
    return result;
};

// Get active sessions for the current employee
const getActiveSessions = asyncHandler(async (req, res) => {
    const employeeId = req.employee.id;
    
    const sessions = await query(
        'SELECT id, user_agent, ip_address, created_at, expires_at FROM sessions WHERE employee_id = $1 AND revoked = FALSE',
        [employeeId]
    );
    
    res.status(200).json({sessions});
});

// Revoke a specific session by session ID
const revokeSession = asyncHandler(async (req, res) => {
    const {sessionId} = req.body;
    const employeeId = req.employee.id;
    
    const revokedSession = await revokeSessions(employeeId, sessionId);
    
    // Log the session revocation
    await logSessionAction(revokedSession[0].id, employeeId, 'revoked', req.ip, req.get('User-Agent'));
    
    res.status(200).json({message: 'Session revoked successfully'});
});

// Revoke all sessions for the current employee
const revokeAllSessions = asyncHandler(async (req, res) => {
    const employeeId = req.employee.id;
    
    const revokedSessions = await revokeSessions(employeeId);
    
    // Log the revocation of all sessions
    for (const session of revokedSessions) {
        await logSessionAction(session.id, employeeId, 'revoked', req.ip, req.get('User-Agent'));
    }
    
    res.status(200).json({message: 'All sessions revoked successfully'});
});

const validateSession = async (token) => {
    const session = await query(
        'SELECT * FROM sessions WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
        [token]
    );
    
    if (session.length === 0) {
        return null;
    }
    
    return session[0];
};

module.exports = {
    getActiveSessions,
    revokeSession,
    revokeAllSessions,
    validateSession
};