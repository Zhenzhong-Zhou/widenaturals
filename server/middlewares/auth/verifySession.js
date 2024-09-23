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
        
        let session_id;
        
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
            const {refreshToken: newRefreshToken, session} = await handleTokenRefresh(refreshToken, ipAddress, userAgent, sessionData, accessTokenExpDate);
            if (newRefreshToken) {
                res.cookie('refreshToken', newRefreshToken, {httpOnly: true, secure: true, sameSite: 'Strict'});
            }
            
            if (session) {
                session_id = session.session_id;
                const sessionResult = await validateSession(session_id);
                
                logger.warn('Session is expired', {
                    context: 'session_validation',
                    sessionId,
                    employeeId,
                    expires_at: session.expires_at
                });
                
                await logAuditAction('auth', 'sessions', 'generate_session', sessionId, employeeId, { expiresAt: sessionResult[0].session.expires_at }, { expiresAt: session.expires_at });
            }
        }
        
        const sessionID = session_id || sessionId;
        
        // Attach session to request for further processing
        req.session = session;
        req.session = {...session, session_id: sessionID}; // todo i change sessionId to sessionID
        
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