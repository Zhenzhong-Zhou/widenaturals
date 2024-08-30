const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const { validateAccessToken } = require('../../utilities/auth/tokenUtils');
const { logTokenAction, logLoginHistory, logAuditAction } = require('../../utilities/log/auditLogger');
const { getIDFromMap } = require("../../utilities/idUtils");
const { getSessionId } = require("../../utilities/auth/sessionUtils");
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
        const decodedAccessToken = await validateAccessToken(accessToken);
        
        if (!decodedAccessToken) {
            logger.warn('Invalid access token payload', { context: 'auth', ipAddress });
            return res.status(401).json({ message: 'Access denied. Invalid token.' });
        }
        
        const originalEmployeeId = await getIDFromMap(decodedAccessToken.sub, 'employees');
        
        req.employee = {
            ...decodedAccessToken,
            originalEmployeeId,
        };
        req.accessToken = accessToken;
        
        // Fetch the session ID using the access token
        const sessionId = await getSessionId(accessToken);
        req.sessionId = sessionId;
        
        // Log successful token validation in audit logs
        await logAuditAction('auth', 'tokens', 'access_validated', sessionId, originalEmployeeId, null, { accessToken });
        
        await logLoginHistory(originalEmployeeId, ipAddress, userAgent);
        return next();
    } catch (error) {
        logger.error('Error verifying token', { context: 'auth', error: error.message });
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = verifyToken;