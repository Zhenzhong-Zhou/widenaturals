const asyncHandler = require('../utils/asyncHandler');
const {validateSession} = require('../../utilities/auth/sessionUtils');
const {logSessionAction, logAuditAction} = require('../../utilities/log/auditLogger');
const logger = require('../../utilities/logger');
const {errorHandler} = require("../error/errorHandler");
const {handleTokenRefresh} = require("../../utilities/auth/tokenUtils");

const verifySession = asyncHandler(async (req, res, next) => {
    try {
        const employeeId = req.employee;  // Extracted from the JWT in verifyToken
        const sessionId = req.sessionId;
        const refreshToken = req.refreshToken;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        const accessTokenExpDate =  req.accessTokenExpDate;
        
        if (!employeeId || !sessionId) {
            errorHandler(401, 'Session is invalid or has expired.');
        }
        
        // Validate the session
        const {session, sessionExpired, sessionAboutToExpire} = await validateSession(sessionId);
        const sessionData = { ...session, session_id: sessionId };
        
        if (!session) {
            const reason = sessionExpired ? 'Session has expired.' : 'Session is invalid.';
            logger.error('Session validation failed', {
                context: 'session_validation',
                employeeId,
                ip: ipAddress,
                userAgent: userAgent,
                reason
            });
            
            // Log session validation failure in audit logs
            await logAuditAction('auth', 'sessions', 'validation_failed', sessionId, employeeId, sessionId, {reason});
            errorHandler(401, reason);
        } else if (sessionAboutToExpire) {
            logger.warn('Session is about to expire', {
                context: 'session_validation',
                sessionId,
                employeeId,
                expires_at: session.expires_at
            });
            
            await logAuditAction('auth', 'sessions', 'about_to_expire', sessionId, employeeId, sessionId, { expiresAt: session.expires_at });
            
            await handleTokenRefresh(refreshToken, ipAddress, userAgent, sessionData, accessTokenExpDate);
        }
        
        // Attach session to request for further processing
        req.session = session;
        req.session = {...session, session_id: sessionId};
        
        // Log successful session validation
        await logSessionAction(sessionId, session.employee_id, 'validated', req.ip, req.get('User-Agent'));
        
        // Log session validation success in audit logs
        await logAuditAction('auth', 'sessions', 'validate', sessionId, employeeId, session, session);
        
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