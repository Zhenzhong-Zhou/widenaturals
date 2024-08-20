const express = require('express');
const welcomeRoutes = require('../routes/welcome');
const initialRoutes = require('../routes/initial');
const authRoutes = require('../routes/auth');
const healthRoutes = require('../routes/health');
const adminRoutes = require('../routes/admin');
const managersRoutes = require('./managers');
const employeesRoutes = require('../routes/employees');
const systemMonitoringRoutes = require('./systemMonitoringRoutes');
const loginHistoryRoutes = require('../routes/loginHistory');
const tokensRoutes = require('../routes/tokens');
const tokenLogsRoutes = require('../routes/tokenLogs');
const sessionsRoutes = require('../routes/sessions');
const sessionLogsRoutes = require('../routes/sessionLogs');
const rateLimiterConfig = require("../utilities/rateLimiterConfig");
const validateEmployeeFields = require("../middlewares/validateEmployeeFields");
const {checkNoAdminsExist} = require("../middlewares/checkAdminMiddleware");
const verifyToken = require("../middlewares/verifyToken");
const verifySession = require("../middlewares/verifySession");
const authorize = require("../middlewares/authorize");

const configureRoutes = (app) => {
    const router = express.Router();
    
    router.use('/auth', rateLimiterConfig.authLimiter, authRoutes);
    
    // Mount specific route modules
    router.use('/welcome', welcomeRoutes);
    router.use('/initial', rateLimiterConfig.adminCreationLimiter, validateEmployeeFields, checkNoAdminsExist, initialRoutes);
    router.use('/status', verifyToken, verifySession, healthRoutes);
    // router.use('/admin', verifyToken, verifySession, adminRoutes);
    router.use('/admin', adminRoutes);
    router.use('/managers', verifyToken, verifySession, managersRoutes);
    router.use('/employees', verifyToken, verifySession,  authorize('manage_employees'), employeesRoutes);
    
    // Log-related routes
    router.use('/logs/system-monitoring', rateLimiterConfig.adminAccessLimiter, systemMonitoringRoutes);
    router.use('/logs/auth-monitoring', loginHistoryRoutes);
    
    
    router.use('/logs/token-logs', tokenLogsRoutes);
    router.use('/logs/session-logs', sessionLogsRoutes); // Detailed session history
    
    // Token and session management
    router.use('/tokens', tokensRoutes); // Handling active/revoked tokens
    router.use('/sessions', sessionsRoutes); // Handling active/revoked sessions
    
    // Use the router under the '/api/v1' base path
    app.use('/api/v1', router);
};

module.exports = configureRoutes;