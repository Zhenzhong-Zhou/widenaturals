const logger = require('../../utilities/logger');
const { CustomError } = require('../error/errorHandler');

const csrfErrorHandler = (err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        // Log the CSRF error
        logger.warn('CSRF token validation failed', {
            error: err.message,
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            ip: req.ip,
            user: req.user ? req.user.id : 'Unauthenticated'
        });
        
        // Create a custom error to pass to the error handler
        const csrfError = new CustomError('Invalid CSRF token', 403, 'EBADCSRFTOKEN');
        next(csrfError);
    } else {
        next(err);
    }
};

module.exports = csrfErrorHandler;