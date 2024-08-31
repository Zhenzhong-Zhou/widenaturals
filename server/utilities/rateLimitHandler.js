const logger = require('../utilities/logger');  // Adjust the path as needed to import your logger

/**
 * Custom rate limit handler to log and respond to rate limit exceedances.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @param {object} options - Options object provided by express-rate-limit.
 */
const rateLimitHandler = (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
        context: 'rate_limit',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        route: req.originalUrl
    });
    res.status(options.statusCode).json({message: options.message});
};

module.exports = rateLimitHandler;