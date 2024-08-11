const asyncHandler = require('../middlewares/asyncHandler');
const { query } = require('../database/database');

const verifySession = asyncHandler(async (req, res, next) => {
    const accessToken = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];
    
    if (!accessToken) {
        return res.status(401).json({ message: 'Access denied. No access token provided.' });
    }
    
    const session = await query(
        'SELECT * FROM sessions WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
        [accessToken]
    );
    
    if (session.length === 0) {
        return res.status(401).json({ message: 'Session is invalid or has expired.' });
    }
    
    // Proceed to the next middleware or route handler
    next();
});

module.exports = verifySession;