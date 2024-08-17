const express = require('express');
const authRoutes = require('../routes/auth');
const welcomeRoutes = require('../routes/welcome');
const healthRoutes = require('../routes/health');
const initialRoutes = require('../routes/initial');
const adminRoutes = require('../routes/admin');
const managersRoutes = require('./managers');
const employeesRoutes = require('../routes/employees');
const validateEmployeeFields = require("../middlewares/validateEmployeeFields");
const {checkNoAdminsExist} = require("../middlewares/checkAdminMiddleware");
const verifyToken = require("../middlewares/verifyToken");
const verifySession = require("../middlewares/verifySession");

const configureRoutes = (app) => {
    const router = express.Router();
    
    router.use('/auth', authRoutes);
    
    // Mount specific route modules
    router.use('/welcome', welcomeRoutes);
    router.use('/initial', validateEmployeeFields, checkNoAdminsExist, initialRoutes);
    router.use('/status', verifyToken, verifySession, healthRoutes);
    // router.use('/admin', verifyToken, verifySession, adminRoutes);
    router.use('/admin', adminRoutes);
    router.use('/managers', verifyToken, verifySession, managersRoutes);
    router.use('/employees', verifyToken, verifySession, employeesRoutes);
    
    // Use the router under the '/api/v1' base path
    app.use('/api/v1', router);
};

module.exports = configureRoutes;