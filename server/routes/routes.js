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
const { checkNoAdminsExist } = require("../middlewares/checkAdminMiddleware");
const verifyToken = require("../middlewares/verifyToken");
const verifySession = require("../middlewares/verifySession");
const handleErrors = require('../middlewares/errorHandler');  // Custom error handling middleware

const configureRoutes = (app) => {
    const router = express.Router();
    
    // Public Routes (No Authentication Required)
    router.use('/welcome', welcomeRoutes);
    router.use('/auth', rateLimiterConfig.authLimiter, authRoutes);
    router.use('/initial', rateLimiterConfig.adminCreationLimiter, validateEmployeeFields, checkNoAdminsExist, initialRoutes);
    
    // Health check route, protected by token and session verification
    router.use('/status', verifyToken, verifySession, healthRoutes);
    
    // Admin Routes
    router.use('/admin', verifyToken, verifySession, adminRoutes);
    
    // Manager Routes
    router.use('/managers', verifyToken, verifySession, managersRoutes);
    
    // Employee Routes
    router.use('/employees', verifyToken, verifySession, employeesRoutes);
    
    // Log-Related Routes (Admin/Manager Access)
    router.use('/logs/system-monitoring', rateLimiterConfig.adminAccessLimiter, verifyToken, verifySession, systemMonitoringRoutes);
    router.use('/logs/auth-monitoring', verifyToken, verifySession, loginHistoryRoutes);
    router.use('/logs/token-logs', verifyToken, verifySession, tokenLogsRoutes);
    router.use('/logs/session-logs', verifyToken, verifySession, sessionLogsRoutes);
    
    // Token and Session Management Routes
    router.use('/tokens', verifyToken, verifySession, tokensRoutes);
    router.use('/sessions', verifyToken, verifySession, sessionsRoutes);
    
    // Use the router under the '/api/v1' base path
    app.use('/api/v1', router);
};

module.exports = configureRoutes;