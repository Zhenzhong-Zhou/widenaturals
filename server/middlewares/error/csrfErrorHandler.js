const logger = require('../../utilities/logger');
const { CustomError } = require('../error/errorHandler');

const csrfErrorHandler = (err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        // Log the CSRF error with details
        logger.warn('CSRF token validation failed', {
            error: err.message,
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            ip: req.ip,
            user: req.user ? req.user.id : 'Unauthenticated'
        });
        
        // Create a custom error with a 403 status code for CSRF token failure
        const csrfError = new CustomError(403, 'Invalid CSRF token', 'EBADCSRFTOKEN');
        next(csrfError);
    } else {
        // Pass the error to the next middleware if it's not a CSRF error
        next(err);
    }
};

module.exports = csrfErrorHandler;