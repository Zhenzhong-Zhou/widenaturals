const asyncHandler = require('../utils/asyncHandler');
const { validateSession } = require('../../utilities/auth/sessionUtils');
const { logSessionAction, logAuditAction } = require('../../utilities/log/auditLogger');
const logger = require('../../utilities/logger');

const verifySession = asyncHandler(async (req, res, next) => {
    try {
        const { employeeId } = req.employee;  // Extracted from the JWT in verifyToken
        const accessToken = req.accessToken;
        
        if (!employeeId || !accessToken) {
            return res.status(401).json({ message: 'Session is invalid or has expired.' });
        }
        
        // Validate the session
        const { session, sessionExpired } = await validateSession(accessToken);
        
        if (!session) {
            const reason = sessionExpired ? 'Session has expired.' : 'Session is invalid.';
            logger.error('Session validation failed', {
                context: 'session_validation',
                employeeId,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                reason
            });
            
            // Log session validation failure in audit logs
            await logAuditAction('auth', 'sessions', 'validation_failed', session.id, employeeId, accessToken, { reason });
            return res.status(401).json({ message: reason });
        }
        
        // Attach session to request for further processing
        req.session = session;
        
        // Log successful session validation
        await logSessionAction(req.session.id, req.session.employee_id, 'validated', req.ip, req.get('User-Agent'));
        
        // Log session validation success in audit logs
        await logAuditAction('auth', 'sessions', 'validate', req.session.id, employeeId, session, { accessToken });
        
        next();
    } catch (error) {
        // Handle unexpected errors
        const message = error.message || 'Internal server error during session validation.';
        
        logger.error('Error during session validation', {
            context: 'session_validation',
            error: message,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        next(error); // Pass error to the centralized error handler
    }
});

module.exports = verifySession;