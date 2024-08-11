const jwt = require('jsonwebtoken');
const asyncHandler = require("./asyncHandler");
const {validateToken, refreshTokens} = require('../utilities/auth/tokenUtils');
const {logAuditAction, logLoginHistory} = require('../utilities/log/auditLogger');
const logger = require('../utilities/logger');

const verifyToken = asyncHandler(async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];
        const refreshToken = req.cookies.refreshToken;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        
        if (!accessToken) {
            logger.warn('Access attempt with no token', {context: 'auth', ipAddress});
            return res.status(401).json({message: 'Access denied. No access token provided.'});
        }
        
        const decodedAccessToken = validateToken(accessToken, process.env.JWT_ACCESS_SECRET);
        
        if (decodedAccessToken) {
            req.employee = decodedAccessToken;
            
            // Log successful token validation
            logger.info('Access token validated', {context: 'auth', userId: decodedAccessToken.sub});
            await logAuditAction('auth', 'access_token_valid', decodedAccessToken.sub, decodedAccessToken.sub);
            
            // Log login history
            await logLoginHistory(decodedAccessToken.sub, ipAddress, userAgent);
            
            return next();
        }
        
        if (refreshToken) {
            const tokens = await refreshTokens(refreshToken);
            
            if (tokens) {
                res.cookie('accessToken', tokens.accessToken, {httpOnly: true, secure: true});
                res.cookie('refreshToken', tokens.refreshToken, {httpOnly: true, secure: true});
                
                req.employee = jwt.decode(tokens.accessToken);
                
                // Log token refresh action
                logger.info('Access token refreshed', {context: 'auth', userId: req.employee.sub});
                await logAuditAction('auth', 'access_token_refreshed', req.employee.sub, req.employee.sub);
                
                return next();
            }
            
            // Log failed refresh attempt
            logger.warn('Failed refresh token attempt', {context: 'auth', ipAddress});
            await logAuditAction('auth', 'refresh_token_failed', null, null, {refreshToken});
        }
        
        return res.status(401).json({message: 'Access denied. Invalid or expired token.'});
        
    } catch (error) {
        logger.error('Error verifying token', {context: 'auth', error: error.message});
        return res.status(500).json({message: 'Internal server error'});
    }
});

module.exports = verifyToken;