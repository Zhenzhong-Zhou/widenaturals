const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const { validateAccessToken, refreshTokens } = require('../utilities/auth/tokenUtils');
const { logTokenAction, logLoginHistory } = require('../utilities/log/auditLogger');
const logger = require('../utilities/logger');
const {getIDFromMap} = require("../utilities/idUtils");
const {createLoginDetails} = require("../utilities/logDetails");

const handleTokenRefresh = async (req, res, newTokens, ipAddress, userAgent) => {
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
        
        // Log token refresh action
        const refreshDetails = createLoginDetails(userAgent, 'auto-refresh', 'Unknown', 'refresh');
        
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
        
        if (!decodedAccessToken) {
            logger.warn('Invalid access token payload', { context: 'auth', ipAddress });
            return res.status(401).json({ message: 'Access denied. Invalid token.' });
        }
        
        const originalEmployeeId = await getIDFromMap(decodedAccessToken.sub, 'employees');
        req.accessToken = accessToken;
        req.employee = decodedAccessToken;
        
        const expiresIn = decodedAccessToken.exp - Math.floor(Date.now() / 1000);
        
        if (req.isLogout) {
            // todo logout undefined cannot log logout info
            console.log("req.isLogout: ", req.isLogout)
            // Log the logout process without refreshing tokens
            logger.info('Logout process detected, skipping token refresh', { context: 'auth', userId: originalEmployeeId });
            console.log("before $$$$$$$$$$$:")
            await logTokenAction(originalEmployeeId, null, 'logout', 'logout_process', ipAddress, userAgent, { actionType: 'logout' });
            console.log("after $$$$$$$$$$$:")
            return next();
        }
        
        // Check if the token is about to expire and handle token refresh
        if (expiresIn < 120 && refreshToken) {
            const newTokens = await refreshTokens(refreshToken);
            // **Post-Expiry Handling:**
            // If the refresh token has expired, do not issue new tokens and force re-authentication
            if (new Date(newTokens.expires_at) < new Date()) {
                logger.warn('Refresh token expired, requiring re-authentication', { context: 'auth', userId: originalEmployeeId });
                return res.status(401).json({ message: 'Session expired. Please log in again.' });
            }
            
            if (newTokens) {
                await handleTokenRefresh(req, res, newTokens, ipAddress, userAgent);
                return next();
            }
            
            logger.warn('Failed refresh token attempt pre-expiry', { context: 'auth', ipAddress });
            await logTokenAction(originalEmployeeId, null, 'refresh', 'failed_refresh', ipAddress, userAgent, { actionType: 'refresh' });
        }
        
        // Proceed with the current access token if it's still valid
        const accessDetails = createLoginDetails(userAgent, 'validated', 'Unknown', 'access');
        await logTokenAction(originalEmployeeId, null, 'access', 'validated', ipAddress, userAgent, accessDetails);
        await logLoginHistory(originalEmployeeId, ipAddress, userAgent);
        return next();
        
    } catch (error) {
        logger.error('Error verifying token', { context: 'auth', error: error.message });
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = verifyToken;