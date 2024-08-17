const express = require('express');
const welcomeRoutes = require('../routes/welcome');
const initialRoutes = require('../routes/initial');
const authRoutes = require('../routes/auth');
const healthRoutes = require('../routes/health');
const adminRoutes = require('../routes/admin');
const managersRoutes = require('./managers');
const employeesRoutes = require('../routes/employees');
const rateLimiterConfig = require("../utilities/rateLimiterConfig");
const validateEmployeeFields = require("../middlewares/validateEmployeeFields");
const {checkNoAdminsExist} = require("../middlewares/checkAdminMiddleware");
const verifyToken = require("../middlewares/verifyToken");
const verifySession = require("../middlewares/verifySession");

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
    router.use('/employees', verifyToken, verifySession, employeesRoutes);
    
    // Use the router under the '/api/v1' base path
    app.use('/api/v1', router);
};

module.exports = configureRoutes;