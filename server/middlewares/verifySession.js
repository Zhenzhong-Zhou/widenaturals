const asyncHandler = require('../middlewares/asyncHandler');
const { validateSession } = require('../utilities/auth/sessionUtils');
const { logSessionAction } = require('../utilities/log/auditLogger');
const {errorHandler} = require("./errorHandler");

const verifySession = asyncHandler(async (req, res, next) => {
    try {
        // Extract the access token from cookies or authorization header
        const accessToken = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];
        
        // Return 401 if no token is provided
        if (!accessToken) {
            errorHandler(401, 'Session is invalid or has expired.');
        }
        
        // Validate the session using the token
        const session = await validateSession(accessToken);
        
        // Return 401 if session is invalid or expired
        if (!session) {
            // Log session validation failure
            await logSessionAction(null, null, 'validation_failed', req.ip, req.get('User-Agent'), 'Invalid or expired session');
            errorHandler(401, 'Session is invalid or has expired.');
        }
        
        // Log successful session validation
        await logSessionAction(session.id, session.employee_id, 'validated', req.ip, req.get('User-Agent'));
        
        // Attach the session to the request object for downstream use
        req.session = session;
        
        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        // Check if error is a custom error, otherwise default to a generic error
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal server error during session validation.';
        
        // Log the error for auditing and debugging purposes
        await logSessionAction(null, null, 'validation_error', req.ip, req.get('User-Agent'), `Error during session validation: ${message}`);
        
        // Return the appropriate error response
        res.status(statusCode).json({ message });
    }
});

module.exports = verifySession;