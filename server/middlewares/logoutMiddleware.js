const logger = require('../utilities/logger');

// Middleware to set the logout flag
const setLogoutFlag = (req, res, next) => {
    req.isLogout = true;  // Explicitly set this flag to true for logout requests
    next();
};

// Middleware to log logout attempts
const logLogoutAttempt = (req, res, next) => {
    logger.info('Logout attempt', {
        userId: req.employee ? req.employee.sub : 'unknown',
        sessionId: req.session ? req.session.id : 'unknown',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });
    next();
};

module.exports = {
    setLogoutFlag,
    logLogoutAttempt
};