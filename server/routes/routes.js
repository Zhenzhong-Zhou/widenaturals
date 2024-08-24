const express = require('express');
const csurf = require("csurf");
const csrfErrorHandler = require("../middlewares/error/csrfErrorHandler");
const welcomeRoutes = require('../routes/welcome');
const initialRoutes = require('../routes/initial');
const authRoutes = require('../routes/auth');
const healthRoutes = require('../routes/health');
const adminRoutes = require('../routes/admin');
const hrManagersRoutes = require('./managers');
const employeesRoutes = require('../routes/employees');
const systemMonitoringRoutes = require('./systemMonitoringRoutes');
const loginHistoryRoutes = require('../routes/loginHistory');
const tokensRoutes = require('../routes/tokens');
const tokenLogsRoutes = require('../routes/tokenLogs');
const sessionsRoutes = require('../routes/sessions');
const sessionLogsRoutes = require('../routes/sessionLogs');
const rateLimiterConfig = require("../utilities/rateLimiterConfig");
const validateEmployeeFields = require("../middlewares/validation/validateEmployeeFields");
const { checkNoAdminsExist } = require("../middlewares/auth/checkAdminMiddleware");
const verifyToken = require("../middlewares/auth/verifyToken");
const verifySession = require("../middlewares/auth/verifySession");
const csrfProtection = require("../middlewares/csrf/scrfMiddleware");

const configureRoutes = (app) => {
    const router = express.Router();
    
    // Public Routes (No Authentication Required)
    router.use('/welcome', welcomeRoutes);
    router.use('/auth', rateLimiterConfig.authLimiter, authRoutes);
    router.use('/initial', rateLimiterConfig.adminCreationLimiter, checkNoAdminsExist, validateEmployeeFields, initialRoutes);
    
    // Health check route, protected by token and session verification
    router.use('/status', verifyToken, verifySession, csrfProtection, healthRoutes);
    
    // Admin Routes
    router.use('/admin', verifyToken, verifySession, csrfProtection, adminRoutes);
    
    // HR Manager Routes
    router.use('/hr', verifyToken, verifySession, csrfProtection, hrManagersRoutes);
    
    // Employee Routes
    router.use('/employees', verifyToken, verifySession, employeesRoutes);
    
    // Log-Related Routes (Admin/Manager Access)
    router.use('/logs/system-monitoring', rateLimiterConfig.adminAccessLimiter, verifyToken, verifySession, csrfProtection, systemMonitoringRoutes);
    router.use('/logs/auth-monitoring', verifyToken, verifySession, csrfProtection, loginHistoryRoutes);
    router.use('/logs/token-logs', verifyToken, verifySession, csrfProtection, tokenLogsRoutes);
    router.use('/logs/session-logs', verifyToken, verifySession, csrfProtection, sessionLogsRoutes);
    
    // Token and Session Management Routes
    router.use('/tokens', verifyToken, verifySession, csrfProtection, tokensRoutes);
    router.use('/sessions', verifyToken, verifySession, csrfProtection, sessionsRoutes);
    
    // Use the router under the '/api/v1' base path
    app.use('/api/v1', router);
};

module.exports = configureRoutes;