const { createRateLimiter } = require('../middlewares/rateLimitMiddleware');

const rateLimiterConfig = {
    adminCreationLimiter: createRateLimiter({
        windowMs: 10 * 60 * 1000, // 10 minutes
        max: 3, // Limit each IP to 3 requests per `windowMs`
        message: "Too many requests. Please try again later."
    }),
    authLimiter: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 requests per `windowMs`
        message: "Too many attempts. Please try again later."
    }),
    generalLimiter: createRateLimiter({
        message: "Too many requests. Please try again later."
    })
};

module.exports = rateLimiterConfig;