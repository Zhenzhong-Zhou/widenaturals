const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const { validateAccessToken, refreshTokens } = require('../../utilities/auth/tokenUtils');
const { logTokenAction, logLoginHistory, logAuditAction } = require('../../utilities/log/auditLogger');
const { getIDFromMap } = require("../../utilities/idUtils");
const { createLoginDetails } = require("../../utilities/log/logDetails");
const { updateSessionWithNewAccessToken, getSessionId } = require("../../utilities/auth/sessionUtils");
const logger = require('../../utilities/logger');

const handleTokenRefresh = async (req, res, newTokens, ipAddress, userAgent, sessionId) => {
    const originalEmployeeId = await getIDFromMap(req.employee.sub, 'employees');
    
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
        req.refreshToken = newTokens.refreshToken;
        
        // Update the session with the new access token
        if (sessionId) {
            await updateSessionWithNewAccessToken(sessionId, newTokens.accessToken);
            
            // Log session update in audit logs
            await logAuditAction('auth', 'sessions', 'update', sessionId, originalEmployeeId, null, { newAccessToken: newTokens.accessToken });
        }
        
        // Log token refresh action
        const refreshDetails = createLoginDetails(userAgent, 'auto-refresh', 'Unknown', 'refresh');
        logger.info('Access token refreshed', { context: 'auth', userId: originalEmployeeId });
        await logTokenAction(originalEmployeeId, null, 'refresh', 'refreshed', ipAddress, userAgent, refreshDetails);
        
        // Log token refresh in audit logs
        await logAuditAction('auth', 'tokens', 'refresh', sessionId, originalEmployeeId, null, { newTokens });
    } else {
        logger.warn('No new tokens were issued due to logout or token expiry', { context: 'auth', userId: originalEmployeeId });
    }
    
    return originalEmployeeId;
};

const verifyToken = asyncHandler(async (req, res, next) => {
    // Check for token in the Authorization header first
    const accessToken = req.cookies.accessToken;
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
        
        if (!decodedAccessToken) {
            logger.warn('Invalid access token payload', { context: 'auth', ipAddress });
            return res.status(401).json({ message: 'Access denied. Invalid token.' });
        }
        
        const originalEmployeeId = await getIDFromMap(decodedAccessToken.sub, 'employees');
        
        if (!req.employee) {
            req.employee = {
                ...decodedAccessToken,
                originalEmployeeId,
            };
        }
        if (!req.accessToken) req.accessToken = accessToken;
        if (!req.refreshToken) req.refreshToken = refreshToken;
        
        // Fetch the session ID using the old access token
        const sessionId = await getSessionId(accessToken);
        const expiresIn = decodedAccessToken.exp - Math.floor(Date.now() / 1000);
        
        if (req.isLogout) {
            const tokenId = await getIDFromMap(refreshToken, 'tokens');
            const logoutDetails = createLoginDetails(userAgent, 'logout_process', 'Unknown', 'logout', { reason: 'User initiated logout' });
            
            logger.info('Logout process detected, skipping token refresh', {
                context: 'auth',
                userId: originalEmployeeId,
                timestamp: new Date().toISOString(),
                reason: 'User initiated logout'
            });
            
            await logTokenAction(originalEmployeeId, tokenId, 'logout', 'logout_process', ipAddress, userAgent, logoutDetails);
            
            // Log logout in audit logs
            await logAuditAction('auth', 'tokens', 'logout', tokenId, originalEmployeeId, null, { reason: 'User initiated logout' });
            return next();
        }
        
        // Check if the token is about to expire and handle token refresh
        if (expiresIn < 120 && refreshToken) {
            const newTokens = await refreshTokens(refreshToken);
            const tokenId = await getIDFromMap(newTokens.refreshToken, 'tokens');
            
            // **Post-Expiry Handling:**
            // If the refresh token has expired, do not issue new tokens and force re-authentication
            if (new Date(newTokens.expires_at) < new Date()) {
                logger.warn('Refresh token expired, requiring re-authentication', { context: 'auth', userId: originalEmployeeId });
                
                // Log failed token refresh due to expiration in audit logs
                await logAuditAction('auth', 'tokens', 'refresh_failed', tokenId, originalEmployeeId, null, { reason: 'Refresh token expired' });
                return res.status(401).json({ message: 'Session expired. Please log in again.' });
            }
            
            if (newTokens) {
                await handleTokenRefresh(req, res, newTokens, ipAddress, userAgent, sessionId);
                return next();
            }
            
            logger.warn('Failed refresh token attempt pre-expiry', { context: 'auth', ipAddress });
            const refreshFailDetails = createLoginDetails(userAgent, 'auto-refresh', 'Unknown', 'refresh', { reason: 'Failed refresh attempt', failureStage: 'pre-expiry' });
            await logTokenAction(originalEmployeeId, tokenId, 'refresh', 'failed_refresh', ipAddress, userAgent, refreshFailDetails);
            
            // Log failed refresh attempt in audit logs
            await logAuditAction('auth', 'tokens', 'refresh_failed', tokenId, originalEmployeeId, null, { reason: 'Failed refresh attempt' });
        }
        
        // Proceed with the current access token if it's still valid
        const accessDetails = createLoginDetails(userAgent, 'validated', 'Unknown', 'access');
        await logTokenAction(originalEmployeeId, null, 'access', 'validated', ipAddress, userAgent, accessDetails);
        
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