const csrf = require('csrf');
const tokens = new csrf();
const logger = require('../../utilities/logger');

/**
 * Middleware to generate CSRF token and set it in a cookie.
 */
const generateCsrfToken = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const token = tokens.create(process.env.CSRF_SECRET);
        logger.info("CSRF token generated", { token });
        
        // Set CSRF token in a cookie, accessible by client-side JavaScript
        res.cookie('XSRF-TOKEN', token, {
            secure: process.env.NODE_ENV === 'production', // Set secure flag in production
            httpOnly: false, // Allow client-side access for CSRF token header
            sameSite: 'Strict', // Prevent CSRF attacks by allowing cookies to be sent only with same-site requests
        });
        
        req.csrfToken = token; // Attach token to request object for later use
    }
    next();
};

/**
 * Middleware to verify CSRF tokens on state-changing requests.
 */
const verifyCsrfToken = (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const token = req.cookies['XSRF-TOKEN'] || req.headers['x-xsrf-token'];
        
        if (!token || !tokens.verify(process.env.CSRF_SECRET, token)) {
            logger.error('CSRF token validation failed', {
                method: req.method,
                path: req.path,
                providedToken: token
            });
            return res.status(403).json({ error: 'CSRF token validation failed' });
        }
        
        // Optionally regenerate the CSRF token after verification for enhanced security
        const newToken = tokens.create(process.env.CSRF_SECRET);
        res.cookie('XSRF-TOKEN', newToken, {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false,
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