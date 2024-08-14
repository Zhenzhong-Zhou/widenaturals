const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const { validateAccessToken, refreshTokens, revokeToken } = require('../utilities/auth/tokenUtils');
const { logTokenAction, logLoginHistory } = require('../utilities/log/auditLogger');
const logger = require('../utilities/logger');
const { getOriginalId } = require('../utilities/getOriginalId');

const handleTokenRefresh = async (req, res, oldAccessToken, newTokens, ipAddress, userAgent) => {
    // Set new tokens in cookies
    res.cookie('accessToken', newTokens.accessToken, { httpOnly: true, secure: true, sameSite: 'Strict'  });
    res.cookie('refreshToken', newTokens.refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict'  });
    
    // Update req with new access token and employee info
    req.employee = jwt.decode(newTokens.accessToken);
    req.accessToken = newTokens.accessToken;
    
    // Log token refresh action
    const originalEmployeeId = await getOriginalId(req.employee.sub, 'employees');
    logger.info('Access token refreshed', { context: 'auth', userId: originalEmployeeId });
    await logTokenAction(originalEmployeeId, 'refresh', 'refreshed', { ipAddress, userAgent });
    
    // Optionally revoke the old refresh token
    if (oldAccessToken) {
        await revokeToken(oldAccessToken, newTokens.salt);
    }
    
    return originalEmployeeId;
};

const verifyToken = asyncHandler(async (req, res, next) => {
    const accessToken = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];
    const refreshToken = req.cookies.refreshToken;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    if (!accessToken) {
        logger.warn('Access attempt with no token', { context: 'auth', ipAddress });
        return res.status(401).json({ message: 'Access denied. No access token provided.' });
    }
    
    try {
        // Validate the access token
        const decodedAccessToken = await validateAccessToken(accessToken);
        
        if (decodedAccessToken) {
            req.accessToken = accessToken;
            const expiresIn = decodedAccessToken.exp - Math.floor(Date.now() / 1000);
            
            // Skip token refresh if this is a logout process
            if (!req.isLogout && expiresIn < 120 && refreshToken) {
                const newTokens = await refreshTokens(refreshToken);
                if (newTokens) {
                    const originalEmployeeId = await handleTokenRefresh(req, res, refreshToken, newTokens, ipAddress, userAgent);
                    return next();
                }
                logger.warn('Failed refresh token attempt pre-expiry', { context: 'auth', ipAddress });
                await logTokenAction(null, 'refresh', 'failed_refresh', { ipAddress, refreshToken });
            }
            
            // Proceed with the current access token if it's still valid
            const originalEmployeeId = await getOriginalId(decodedAccessToken.sub, 'employees');
            req.employee = decodedAccessToken;
            await logTokenAction(originalEmployeeId, 'access', 'validated', { ipAddress, userAgent });
            await logLoginHistory(originalEmployeeId, ipAddress, userAgent);
            return next();
        }
        
        // Post-expiry refresh: Handle refresh token if access token is invalid or expired
        if (refreshToken && !req.isLogout) {
            const newTokens = await refreshTokens(refreshToken);
            if (newTokens) {
                const originalEmployeeId = await handleTokenRefresh(req, res, accessToken, newTokens, ipAddress, userAgent);
                return next();
            }
            
            // Log failed refresh attempt
            logger.warn('Failed refresh token attempt post-expiry', { context: 'auth', ipAddress });
            await logTokenAction(null, 'refresh', 'failed_refresh', { ipAddress, refreshToken });
        }
        
        return res.status(401).json({ message: 'Access denied. Invalid or expired token.' });
        
    } catch (error) {
        logger.error('Error verifying token', { context: 'auth', error: error.message });
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = verifyToken;