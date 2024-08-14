const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const { validateAccessToken, refreshTokens, revokeToken } = require('../utilities/auth/tokenUtils');
const { logTokenAction, logLoginHistory } = require('../utilities/log/auditLogger');
const logger = require('../utilities/logger');
const { getOriginalId } = require('../utilities/getOriginalId');

const handleTokenRefresh = async (req, res, newTokens, ipAddress, userAgent) => {
    const originalEmployeeId = await getOriginalId(req.employee.sub, 'employees');
    
    // Ensure the refresh token has not expired before proceeding
    if (new Date(newTokens.expires_at) < new Date()) {
        logger.warn('Refresh token has expired, cannot generate new tokens', { context: 'auth', userId: originalEmployeeId });
        throw new Error('Refresh token has expired. Please log in again.');
    }
    
    // If the token is valid, proceed to set new tokens in cookies
    if (newTokens && !req.isLogout) {
        // Set new tokens in cookies
        res.cookie('accessToken', newTokens.accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.cookie('refreshToken', newTokens.refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
        
        // Update req with new access token and employee info
        req.employee = jwt.decode(newTokens.accessToken);
        req.accessToken = newTokens.accessToken;
        
        // Log token refresh action
        const refreshDetails = {
            method: 'auto-refresh',
            timestamp: new Date().toISOString(),
            actionType: 'refresh'
        };
        logger.info('Access token refreshed', { context: 'auth', userId: originalEmployeeId });
        await logTokenAction(originalEmployeeId, null, 'refresh', 'refreshed', ipAddress, userAgent, refreshDetails);
    } else {
        logger.warn('No new tokens were issued due to logout or token expiry', { context: 'auth', userId: originalEmployeeId });
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
        const originalEmployeeId = await getOriginalId(decodedAccessToken.sub, 'employees');
        
        if (decodedAccessToken) {
            req.accessToken = accessToken;
            const expiresIn = decodedAccessToken.exp - Math.floor(Date.now() / 1000);
            
            // Check if this is a logout process and skip token refresh if so
            if (!req.isLogout && expiresIn < 120 && refreshToken) {
                const newTokens = await refreshTokens(refreshToken);
                if (newTokens) {
                    await handleTokenRefresh(req, res, refreshToken, newTokens, ipAddress, userAgent);
                    return next();
                }
                logger.warn('Failed refresh token attempt pre-expiry', { context: 'auth', ipAddress });
                await logTokenAction(originalEmployeeId, null, 'refresh', 'failed_refresh', ipAddress, userAgent, { actionType: 'refresh' });
            } else if (req.isLogout) {
                // Log the logout process without refreshing tokens
                logger.info('Logout process detected, skipping token refresh', { context: 'auth', userId: originalEmployeeId });
                await logTokenAction(originalEmployeeId, null, 'logout', 'logout_process', ipAddress, userAgent, { actionType: 'logout' });
                return next();
            }
            
            // Proceed with the current access token if it's still valid
            const accessDetails = {
                method: 'standard',
                timestamp: new Date().toISOString(),
                actionType: 'access'
            };
            req.employee = decodedAccessToken;
            await logTokenAction(originalEmployeeId, null, 'access', 'validated', ipAddress, userAgent, accessDetails);
            await logLoginHistory(originalEmployeeId, ipAddress, userAgent);
            return next();
        }
        
        // Post-expiry refresh: Handle refresh token if access token is invalid or expired
        if (refreshToken && !req.isLogout) {
            try {
                const newTokens = await refreshTokens(refreshToken, ipAddress, userAgent);
                if (newTokens) {
                    await handleTokenRefresh(req, res, newTokens, ipAddress, userAgent);
                    return next();
                }
            } catch (error) {
                // Log failed refresh attempt
                logger.warn('Failed refresh token attempt post-expiry or due to expiration', { context: 'auth', ipAddress });
                await logTokenAction(null, null, 'refresh', 'failed_refresh', ipAddress, userAgent, { actionType: 'refresh' });
            }
            
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
        
        return res.status(401).json({ message: 'Access denied. Invalid or expired token.' });
        
    } catch (error) {
        logger.error('Error verifying token', { context: 'auth', error: error.message });
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = verifyToken;