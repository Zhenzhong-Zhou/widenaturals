const express = require('express');
const welcomeRoutes = require('../routes/welcome');
const healthRoutes = require('../routes/health');
const adminRoutes = require('../routes/admin');
const managerRoutes = require('../routes/manager');
const employeeRoutes = require('../routes/employees');

const configureRoutes = (app) => {
    const router = express.Router();
    
    // Mount specific route modules
    router.use('/welcome', welcomeRoutes);
    router.use('/health', healthRoutes);
    router.use('/admin', adminRoutes);
    router.use('/manager', managerRoutes);
    router.use('/employees', employeeRoutes);
    
    // Use the router under the '/api/v1' base path
    app.use('/api/v1', router);
};

module.exports = configureRoutes;