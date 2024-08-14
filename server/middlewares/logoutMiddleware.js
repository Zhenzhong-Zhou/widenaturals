const logger = require('../utilities/logger');

// Middleware to set the logout flag
const setLogoutFlag = (req, res, next) => {
    req.isLogout = true;  // Explicitly set this flag to true for logout requests
    next();
};

// Middleware to log logout attempts
const logLogoutAttempt = (req, res, next) => {
    try {
        logger.info('Logout attempt', {
            context: 'auth',
            userId: req.employee ? req.employee.sub : 'unknown',
            sessionId: req.session ? req.session.id : 'unknown',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            additionalInfo: 'User is attempting to log out',  // Example of custom message
        });
    } catch (error) {
        logger.error('Error logging logout attempt', {
            context: 'auth',
            error: error.message,
            stack: error.stack,
            userId: req.employee ? req.employee.sub : 'unknown',
            sessionId: req.session ? req.session.id : 'unknown',
        });
    }
    next();
};

module.exports = {
    setLogoutFlag,
    logLogoutAttempt
};