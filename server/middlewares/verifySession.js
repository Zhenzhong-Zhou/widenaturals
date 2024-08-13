const asyncHandler = require('../middlewares/asyncHandler');
const { validateSession } = require('../utilities/auth/sessionUtils');
const { logSessionAction } = require('../utilities/log/auditLogger');
const {errorHandler} = require("./errorHandler");

const verifySession = asyncHandler(async (req, res, next) => {
    try {
        // Ensure the employee ID (hashed ID) is available from the verifyToken middleware
        const hashedEmployeeId = req.employee.sub;
        
        if (!hashedEmployeeId) {
            return res.status(401).json({ message: 'Session is invalid or has expired.' });
        }
        
        // Validate the session using the token or employee ID
        const session = await validateSession(hashedEmployeeId);
        
        // Return 401 if session is invalid or expired
        if (!session) {
            // Log session validation failure
            await logSessionAction(null, hashedEmployeeId, 'validation_failed', req.ip, req.get('User-Agent'), 'Invalid or expired session');
            return res.status(401).json({ message: 'Session is invalid or has expired.' });
        }
        
        // Log successful session validation
        await logSessionAction(session.id, session.employee_id, 'validated', req.ip, req.get('User-Agent'));
        
        // Attach the session to the request object for downstream use
        req.session = session;
        
        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        // Handle unexpected errors
        const message = error.message || 'Internal server error during session validation.';
        
        // Log the error for auditing and debugging purposes
        await logSessionAction(null, null, 'validation_error', req.ip, req.get('User-Agent'), `Error during session validation: ${message}`);
        errorHandler(500, message);
    }
});

module.exports = verifySession;