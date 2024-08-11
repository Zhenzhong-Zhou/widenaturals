const asyncHandler = require('../middlewares/asyncHandler');
const { query } = require('../database/database');

// Get active sessions for the current employee
const getActiveSessions = asyncHandler(async (req, res) => {
    const employeeId = req.employee.id;
    
    const sessions = await query(
        'SELECT id, user_agent, ip_address, created_at, expires_at FROM sessions WHERE employee_id = $1 AND revoked = FALSE',
        [employeeId]
    );
    
    res.status(200).json({ sessions });
});

// Revoke a specific session by session ID
const revokeSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    const employeeId = req.employee.id;
    
    await query(
        'UPDATE sessions SET revoked = TRUE WHERE id = $1 AND employee_id = $2',
        [sessionId, employeeId]
    );
    
    res.status(200).json({ message: 'Session revoked successfully' });
});

// Revoke all sessions for the current employee
const revokeAllSessions = asyncHandler(async (req, res) => {
    const employeeId = req.employee.id;
    
    await query(
        'UPDATE sessions SET revoked = TRUE WHERE employee_id = $1',
        [employeeId]
    );
    
    res.status(200).json({ message: 'All sessions revoked successfully' });
});

module.exports = {
    getActiveSessions,
    revokeSession,
    revokeAllSessions,
};
