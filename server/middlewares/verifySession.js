const asyncHandler = require('../middlewares/asyncHandler');
const { validateSession } = require('../utilities/auth/sessionUtils');
const { logSessionAction } = require('../utilities/log/auditLogger');
const { errorHandler } = require('./errorHandler');
const logger = require('../utilities/logger');

const verifySession = asyncHandler(async (req, res, next) => {
    try {
        // The employee ID (hashed ID) and token should already be available from the verifyToken middleware
        const hashedEmployeeId = req.employee.sub;  // Extracted from the JWT in verifyToken
        const token = req.accessToken;
        
        if (!hashedEmployeeId || !token) {
            return res.status(401).json({ message: 'Session is invalid or has expired.' });
        }
        
        // Validate the session using the token
        const session = await validateSession(token);
        
        // Return 401 if session is invalid or expired
        if (!session) {
            // Log session validation failure using the original session ID
            logger.error('Session validation failed', {
                context: 'session_validation',
                employeeId: hashedEmployeeId,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                reason: 'Invalid or expired session'
            });
            return res.status(401).json({ message: 'Session is invalid or has expired.' });
        }
        
        // Log successful session validation using the original session ID
        await logSessionAction(session.id, session.employee_id, 'validated', req.ip, req.get('User-Agent'));
        
        // Attach the session to the request object for downstream use
        req.session = session;
        
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
            userAgent: req.get('User-Agent'),
        });
        
        errorHandler(500, message);
    }
});

module.exports = verifySession;