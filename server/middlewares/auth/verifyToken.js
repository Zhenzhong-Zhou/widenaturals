const asyncHandler = require('../utils/asyncHandler');
const { validateAccessToken, validateStoredRefreshToken} = require('../../utilities/auth/tokenUtils');
const { logLoginHistory, logAuditAction } = require('../../utilities/log/auditLogger');
const logger = require('../../utilities/logger');

const verifyToken = asyncHandler(async (req, res, next) => {
    // Extract tokens and necessary details from the request
    const accessToken = req.cookies.accessToken;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    if (!accessToken) {
        logger.warn('Access attempt with no token', { context: 'auth', ipAddress });
        return res.status(401).json({ message: 'Access denied. No access token provided.' });
    }
    
    try {
        // Validate the access token
        const {decodedToken, employeeId} = await validateAccessToken(accessToken);
        
        if (!decodedToken) {
            logger.warn('Invalid access token payload', { context: 'auth', ipAddress });
            return res.status(401).json({ message: 'Access denied. Invalid token.' });
        }
        
        req.employee = employeeId
        req.accessToken = decodedToken;
        
        // Log successful token validation in audit logs
        await logAuditAction('auth', 'tokens', 'access_validated', employeeId, employeeId, accessToken, { decodedToken });
        
        await logLoginHistory(employeeId, ipAddress, userAgent);
        return next();
    } catch (error) {
        logger.error('Error verifying token', { context: 'auth', error: error.message });
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = verifyToken;