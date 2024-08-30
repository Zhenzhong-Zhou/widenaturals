const { createRateLimiter } = require('../middlewares/rateLimiting/rateLimitMiddleware');
const rateLimitHandler = require("./rateLimitHandler");

const rateLimiterConfig = {
    // Rate limiter for admin creation, highly restrictive
    adminCreationLimiter: createRateLimiter({
        windowMs: 10 * 60 * 1000, // 10 minutes
        max: 3, // Limit each IP to 3 requests per `windowMs`
        message: "Too many requests. Please try again later.",
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        handler: rateLimitHandler,
    }),
    
    // Rate limiter for general admin access, moderately restrictive
    adminAccessLimiter: createRateLimiter({
        windowMs: 10 * 60 * 1000, // 10 minutes
        max: 50, // Limit each IP to 50 requests per `windowMs`
        message: "Too many requests. Please try again later.",
        standardHeaders: true,
        legacyHeaders: false,
        handler: rateLimitHandler,
    }),
    
    // Rate limiter for authentication routes, more restrictive due to sensitivity
    loginLimiter: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 requests per `windowMs`
        message: "Too many attempts. Please try again later.",
        standardHeaders: true,
        legacyHeaders: false,
        handler: rateLimitHandler,
    }),
    
    // Rate limiter for authentication routes, more restrictive due to sensitivity
    checkLimiter: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: "Too many requests from this IP, please try again after 15 minutes.",
        standardHeaders: true,
        legacyHeaders: false,
        handler: rateLimitHandler,
    }),
    
    // Rate limiter for authentication routes, more restrictive due to sensitivity
    refreshLimiter: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // Limit each IP to 100 requests per windowMs
        message: "Too many requests from this IP, please try again after 15 minutes.",
        standardHeaders: true,
        legacyHeaders: false,
        handler: rateLimitHandler,
    }),
    
    // General rate limiter for less sensitive routes
    generalLimiter: createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Example: Limit each IP to 100 requests per `windowMs`
        message: "Too many requests. Please try again later.",
        standardHeaders: true,
        legacyHeaders: false,
        handler: rateLimitHandler,
    }),
};

module.exports = rateLimiterConfig;