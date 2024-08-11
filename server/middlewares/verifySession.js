const asyncHandler = require('../middlewares/asyncHandler');
const {validateSession} = require('../utilities/auth/sessionUtils');
const {logSessionAction} = require('../utilities/log/auditLogger');

const verifySession = asyncHandler(async (req, res, next) => {
    const accessToken = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];
    
    if (!accessToken) {
        return res.status(401).json({message: 'Access denied. No access token provided.'});
    }
    
    const session = await validateSession(accessToken);
    
    if (!session) {
        return res.status(401).json({message: 'Session is invalid or has expired.'});
    }
    
    // Log session validation success
    await logSessionAction(session.id, session.employee_id, 'validated', req.ip, req.get('User-Agent'));
    
    // Attach the session to the request object if needed
    req.session = session;
    
    // Proceed to the next middleware or route handler
    next();
});

module.exports = verifySession;