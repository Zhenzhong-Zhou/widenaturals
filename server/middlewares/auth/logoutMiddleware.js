const logger = require('../../utilities/logger');
const {logAuditAction} = require("../../utilities/log/auditLogger");
const {getIDFromMap} = require("../../utilities/idUtils");

// Middleware to set the logout flag
const setLogoutFlag = (req, res, next) => {
    req.isLogout = true;  // Explicitly set this flag to true for logout requests
    next();
};

// Middleware to log logout attempts
const logLogoutAttempt = async (req, res, next) => {
    try {
        const hashedEmployeeID = req.employee ? req.employee.sub : 'unknown';
        const sessionId = req.session ? req.session.id : 'unknown';
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        
        const originalEmployeeID = await getIDFromMap(hashedEmployeeID, 'employees');
        
        // Log the logout attempt in the application logs
        logger.info('Logout attempt', {
            context: 'auth',
            originalEmployeeID,
            sessionId,
            ip: ipAddress,
            userAgent,
            timestamp: new Date().toISOString(),
            additionalInfo: 'User is attempting to log out',
        });
        
        // Log the logout attempt in the audit logs
        await logAuditAction('auth', 'logout', 'attempt', sessionId, originalEmployeeID, null, {ipAddress, userAgent});
    } catch (error) {
        logger.error('Error logging logout attempt', {
            context: 'auth',
            error: error.message,
            stack: error.stack,
            employeeId: req.employee ? req.employee.sub : 'unknown',
            sessionId: req.session ? req.session.id : 'unknown',
        });
    }
    next();
};

module.exports = {
    setLogoutFlag,
    logLogoutAttempt
};