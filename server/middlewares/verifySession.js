const asyncHandler = require('../middlewares/asyncHandler');
const { validateSession } = require('../utilities/auth/sessionUtils');
const { logSessionAction } = require('../utilities/log/auditLogger');

const verifySession = asyncHandler(async (req, res, next) => {
    try {
        // Extract the access token from cookies or authorization header
        const accessToken = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];
        
        // Return 401 if no token is provided
        if (!accessToken) {
            return res.status(401).json({ message: 'Access denied. No access token provided.' });
        }
        
        // Validate the session using the token
        const session = await validateSession(accessToken);
        
        // Return 401 if session is invalid or expired
        if (!session) {
            // Log session validation failure
            await logSessionAction(null, null, 'validation_failed', req.ip, req.get('User-Agent'), 'Invalid or expired session');
            return res.status(401).json({ message: 'Session is invalid or has expired.' });
        }
        
        // Log successful session validation
        await logSessionAction(session.id, session.employee_id, 'validated', req.ip, req.get('User-Agent'));
        
        // Attach the session to the request object for downstream use
        req.session = session;
        
        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        // Log the error for auditing and debugging purposes
        await logSessionAction(null, null, 'validation_error', req.ip, req.get('User-Agent'), `Error during session validation: ${error.message}`);
        
        // Return a generic 500 Internal Server Error response
        res.status(500).json({ message: 'Internal server error during session validation.' });
    }
});

module.exports = verifySession;