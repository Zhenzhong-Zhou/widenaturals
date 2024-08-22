const asyncHandler = require('../utlis/asyncHandler');
const { validateSession } = require('../../utilities/auth/sessionUtils');
const { logSessionAction, logAuditAction } = require('../../utilities/log/auditLogger');
const logger = require('../../utilities/logger');
const { refreshTokens } = require("../../utilities/auth/tokenUtils");

const verifySession = asyncHandler(async (req, res, next) => {
    try {
        // The employee ID (hashed ID) and token should already be available from the verifyToken middleware
        const hashedEmployeeId = req.employee.sub;  // Extracted from the JWT in verifyToken
        const accessToken = req.accessToken;
        const refreshToken = req.refreshToken;
        
        if (!hashedEmployeeId || !accessToken || !refreshToken) {
            return res.status(401).json({ message: 'Session is invalid or has expired.' });
        }
        
        // Cache session during the request lifecycle
        if (!req.session) {
            const { session, sessionExpired } = await validateSession(accessToken);
            req.session = session;
            
            if (!session && sessionExpired) {
                // Attempt to refresh the token if the session has expired
                try {
                    const newAccessToken = await refreshTokens(refreshToken);
                    const { session: refreshedSession } = await validateSession(newAccessToken);
                    
                    if (!refreshedSession) {
                        throw new Error('Session is invalid or has expired.');
                    }
                    
                    req.accessToken = newAccessToken;
                    req.session = refreshedSession;
                    
                    logger.info('Session successfully refreshed', {
                        context: 'session_validation',
                        employeeId: hashedEmployeeId,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    // Log session refresh in audit logs
                    await logAuditAction('auth', 'sessions', 'refresh', req.session.id, hashedEmployeeId, null, { newAccessToken });
                } catch (refreshError) {
                    logger.error('Failed to refresh session during validation', {
                        context: 'session_validation',
                        error: refreshError.message,
                        ip: req.ip,
                        userAgent: req.get('User-Agent')
                    });
                    
                    // Log session refresh failure in audit logs
                    await logAuditAction('auth', 'sessions', 'refresh_failed',  req.session.id, hashedEmployeeId, null, { error: refreshError.message });
                    
                    return res.status(401).json({ message: 'Session is invalid or has expired.' });
                }
            }
            
            if (!req.session) {
                const reason = sessionExpired ? 'Session has expired.' : 'Session is invalid.';
                logger.error('Session validation failed', {
                    context: 'session_validation',
                    employeeId: hashedEmployeeId,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    reason
                });
                
                // Log session validation failure in audit logs
                await logAuditAction('auth', 'sessions', 'validation_failed', null, hashedEmployeeId, null, { reason });
                return res.status(401).json({ message: reason });
            }
        }
        
        // Log successful session validation
        await logSessionAction(req.session.id, req.session.employee_id, 'validated', req.ip, req.get('User-Agent'));
        
        // Log session validation success in audit logs
        await logAuditAction('auth', 'sessions', 'validate', req.session.id, req.session.employee_id, null, { accessToken });
        
        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        // Handle unexpected errors
        const message = error.message || 'Internal server error during session validation.';
        
        // Log the error without referencing a session ID (use a generic log or error context)
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