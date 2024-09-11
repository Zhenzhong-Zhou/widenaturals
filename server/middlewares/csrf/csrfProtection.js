const csrf = require('csrf');
const tokens = new csrf();
const logger = require('../../utilities/logger');
const {errorHandler} = require("../error/errorHandler");

/**
 * Middleware to generate CSRF token and set it in a cookie.
 */
const generateCsrfToken = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const token = tokens.create(process.env.CSRF_SECRET);
        logger.info("CSRF token generated");
        
        // Set CSRF token in a cookie, accessible by client-side JavaScript
        res.cookie('XSRF-TOKEN', token, {
            secure: true, // Set secure flag in production
            httpOnly: false, // Allow client-side access for CSRF token header
            sameSite: 'Strict', // Prevent CSRF attacks by restricting cross-site request use of cookies
        });
        
        req.csrfToken = token; // Attach token to request object for later use
    }
    next();
};

/**
 * Middleware to verify CSRF tokens on state-changing requests.
 */
const verifyCsrfToken = (req, res, next) => {
    // Bypass CSRF check for login route
    if (
        (req.path === '/api/v1/auth/login' && req.method === 'POST') ||
        (req.path === '/api/v1/initial/admin-creation' && req.method === 'POST')
    ) {
        return next();
    }
    
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const tokenFromCookie = req.cookies['XSRF-TOKEN']; // Token from cookie
        const tokenFromHeader = req.headers['x-csrf-token']; // Token from header
        
        logger.info("Verifying CSRF token");
        
        // Check if the token is present and valid
        if (!tokenFromHeader || !tokens.verify(process.env.CSRF_SECRET, tokenFromHeader) || tokenFromHeader !== tokenFromCookie) {
            logger.error('CSRF token validation failed', {
                method: req.method,
                path: req.path,
                providedToken: tokenFromHeader
            });
            errorHandler(403, 'CSRF token validation failed', { reason: 'Invalid CSRF token provided' });
        }
        
        // Optionally regenerate the CSRF token after verification for enhanced security
        const newToken = tokens.create(process.env.CSRF_SECRET);
        res.cookie('XSRF-TOKEN', newToken, {
            secure: true,
            httpOnly: false, // Keep httpOnly as false if client-side JavaScript needs access
            sameSite: 'Strict',
        });
        req.csrfToken = newToken; // Update the token in the request for further use
    }
    next();
};

module.exports = {
    generateCsrfToken,
    verifyCsrfToken
};