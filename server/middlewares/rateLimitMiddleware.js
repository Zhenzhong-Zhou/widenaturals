const rateLimit = require('express-rate-limit');
const logger = require('../utilities/logger');

const createRateLimiter = ({
                               windowMs = 15 * 60 * 1000, // Default 15 minutes
                               max = 100,                 // Default 100 requests per window
                               message = 'Too many requests, please try again later.',
                               headers = true,            // Send rate limit info in headers
                               statusCode = 429,          // HTTP status code for rate limit exceeded
                               keyGenerator = (req) => req.ip, // Key generator to identify clients (default: IP address)
                               skip = () => false,        // Function to skip rate limiting in certain cases
                               handler = (req, res) => {  // Custom handler when rate limit is exceeded
                                   logger.warn(`Rate limit exceeded for ${req.ip}`);
                                   res.status(statusCode).json({ message });
                               }
                           } = {}) => {
    return rateLimit({
        windowMs,
        max,
        message,
        headers,
        statusCode,
        keyGenerator,
        skip,
        handler
    });
};

module.exports = { createRateLimiter };