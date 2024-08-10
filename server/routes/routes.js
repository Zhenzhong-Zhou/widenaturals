const express = require('express');
const authRoutes = require('../routes/auth');
const welcomeRoutes = require('../routes/welcome');
const healthRoutes = require('../routes/health');
const adminRoutes = require('../routes/admin');
const managerRoutes = require('../routes/manager');
const employeeRoutes = require('../routes/employees');
const verifyToken = require("../middlewares/verifyToken");

const configureRoutes = (app) => {
    const router = express.Router();
    
    router.use('/auth', authRoutes);
    
    // Mount specific route modules
    router.use('/welcome', welcomeRoutes);
    router.use('/health', healthRoutes);
    router.use('/admin', adminRoutes);
    router.use('/manager', managerRoutes);
    router.use('/employees', verifyToken, employeeRoutes);
    
    // Use the router under the '/api/v1' base path
    app.use('/api/v1', router);
};

module.exports = configureRoutes;