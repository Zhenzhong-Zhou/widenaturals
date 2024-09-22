const asyncHandler = require('../utils/asyncHandler');
const {validateAccessToken, validateStoredRefreshToken} = require('../../utilities/auth/tokenUtils');
const {logLoginHistory, logAuditAction} = require('../../utilities/log/auditLogger');
const logger = require('../../utilities/logger');
const {errorHandler} = require("../error/errorHandler");

const verifyToken = asyncHandler(async (req, res, next) => {
    // Extract tokens and necessary details from the request
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    if (!accessToken) {
        logger.warn('Access attempt with no token', {context: 'auth', ipAddress});
        errorHandler(401, 'Access denied. No access token provided.');
    }
    
    try {
        // Validate the access token
        const { employeeId, roleId, sessionId, accessTokenExpDate,newAccessToken, newRefreshToken } = await validateAccessToken(accessToken, refreshToken, ipAddress, userAgent);
        
        if ((!employeeId || !roleId || !sessionId) && (!newAccessToken || !newAccessToken)) {
            logger.warn('Invalid access token payload', { context: 'auth', ipAddress });
            errorHandler(401, 'Access denied. Invalid token.');
        }
        
        req.employee = employeeId
        req.role = roleId
        req.sessionId = sessionId;
        req.accessTokenExpDate = accessTokenExpDate;
        req.refreshToken = newRefreshToken;
        
        // Set new tokens in cookies if they are refreshed
        if (newAccessToken && newAccessToken !== accessToken) {
            res.cookie('accessToken', newAccessToken, {httpOnly: true, secure: true, sameSite: 'Strict'});
        }

        if (newRefreshToken && newRefreshToken !== refreshToken) {
            res.cookie('refreshToken', newRefreshToken, {httpOnly: true, secure: true, sameSite: 'Strict'});
        }

        // Log successful token validation in audit logs
        await logAuditAction('auth', 'tokens', 'access_validated', employeeId, employeeId, accessToken, null);

        await logLoginHistory(employeeId, ipAddress, userAgent);
        return next();
    } catch (error) {
        if (error.message === 'TokenExpired') {
            // Token expired, handle accordingly
            logger.warn('Access token has expired', { context: 'auth', ipAddress });
            errorHandler(401, 'Token expired. Please refresh your token.');
        } else if (error.message === 'InvalidToken') {
            // Invalid token, handle accordingly
            logger.warn('Invalid access token', { context: 'auth', ipAddress });
            errorHandler(401, 'Access denied. Invalid token.');
        } else {
            // Handle any unexpected errors
            logger.error('Error verifying access token', { context: 'auth', error: error.message });
            next(error);
        }
    }
});

module.exports = verifyToken;