const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const { validateAccessToken, refreshTokens, revokeToken } = require('../utilities/auth/tokenUtils');
const { logTokenAction, logLoginHistory } = require('../utilities/log/auditLogger');
const logger = require('../utilities/logger');
const { getOriginalEmployeeId } = require('../utilities/getOriginalId');

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
            const expiresIn = decodedAccessToken.exp - Math.floor(Date.now() / 1000);
            
            // Pre-expiry refresh: If the token is about to expire within the next 2 minutes
            if (expiresIn < 120 && refreshToken) {
                const newTokens = await refreshTokens(refreshToken);
                
                if (newTokens) {
                    res.cookie('accessToken', newTokens.accessToken, { httpOnly: true, secure: true });
                    res.cookie('refreshToken', newTokens.refreshToken, { httpOnly: true, secure: true });
                    
                    req.employee = jwt.decode(newTokens.accessToken);
                    
                    // Log token refresh action
                    const originalEmployeeId = await getOriginalEmployeeId(req.employee.sub);
                    logger.info('Access token refreshed pre-expiry', { context: 'auth', userId: originalEmployeeId });
                    await logTokenAction(originalEmployeeId, 'refresh', 'refreshed', { ipAddress, userAgent });
                    
                    // Optionally revoke the old refresh token
                    await revokeToken(refreshToken, newTokens.salt);  // Assuming salt is accessible here
                    
                    return next();
                }
                
                logger.warn('Failed refresh token attempt pre-expiry', { context: 'auth', ipAddress });
                await logTokenAction(null, 'refresh', 'failed_refresh', { ipAddress, refreshToken });
            }
            
            // Proceed with the current access token if it's still valid
            const originalEmployeeId = await getOriginalEmployeeId(decodedAccessToken.sub);
            req.employee = decodedAccessToken;
            await logTokenAction(originalEmployeeId, 'access', 'validated', { ipAddress, userAgent });
            await logLoginHistory(originalEmployeeId, ipAddress, userAgent);
            
            return next();
        }
        
        // Post-expiry refresh: Handle refresh token if access token is invalid or expired
        if (refreshToken) {
            const newTokens = await refreshTokens(refreshToken);
            
            if (newTokens) {
                res.cookie('accessToken', newTokens.accessToken, { httpOnly: true, secure: true });
                res.cookie('refreshToken', newTokens.refreshToken, { httpOnly: true, secure: true });
                
                req.employee = jwt.decode(newTokens.accessToken);
                
                // Log token refresh action
                const originalEmployeeId = await getOriginalEmployeeId(req.employee.sub);
                logger.info('Access token refreshed post-expiry', { context: 'auth', userId: originalEmployeeId });
                await logTokenAction(originalEmployeeId, 'refresh', 'refreshed', { ipAddress, userAgent });
                
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