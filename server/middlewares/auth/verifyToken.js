const asyncHandler = require('../utils/asyncHandler');
const {validateAccessToken, validateStoredRefreshToken} = require('../../utilities/auth/tokenUtils');
const {logLoginHistory, logAuditAction} = require('../../utilities/log/auditLogger');
const logger = require('../../utilities/logger');
const {errorHandler} = require("../error/errorHandler");

const verifyToken = asyncHandler(async (req, res, next) => {
    // Extract tokens and necessary details from the request
    const accessToken = req.cookies.accessToken;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    if (!accessToken) {
        logger.warn('Access attempt with no token', {context: 'auth', ipAddress});
        errorHandler(401, 'Access denied. No access token provided.');
    }
    
    try {
        // Validate the access token
        const {employeeId, roleId, sessionId, accessTokenExpDate} = await validateAccessToken(accessToken);
        
        if (!employeeId || !roleId || !sessionId) {
            logger.warn('Invalid access token payload', {context: 'auth', ipAddress});
            errorHandler(401, 'Access denied. Invalid token.');
        }
        
        req.employee = employeeId
        req.role = roleId
        req.sessionId = sessionId;
        req.accessTokenExpDate = accessTokenExpDate;
        
        // Log successful token validation in audit logs
        await logAuditAction('auth', 'tokens', 'access_validated', employeeId, employeeId, accessToken, null);
        
        await logLoginHistory(employeeId, ipAddress, userAgent);
        return next();
    } catch (error) {
        logger.error('Error verifying token', {context: 'auth', error: error.message});
        next(error);
    }
});

module.exports = verifyToken;