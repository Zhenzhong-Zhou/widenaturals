const express = require('express');
const authRoutes = require('../routes/auth');
const welcomeRoutes = require('../routes/welcome');
const healthRoutes = require('../routes/health');
const initialRoutes = require('../routes/initial');
const adminRoutes = require('../routes/admin');
const managersRoutes = require('./managers');
const employeesRoutes = require('../routes/employees');
const verifyToken = require("../middlewares/verifyToken");
const verifySession = require("../middlewares/verifySession");

const configureRoutes = (app) => {
    const router = express.Router();
    
    router.use('/auth', authRoutes);
    
    // Mount specific route modules
    router.use('/welcome', welcomeRoutes);
    router.use('/status', healthRoutes);
    router.use('/initial', initialRoutes);
    router.use('/admin', verifyToken, verifySession, adminRoutes);
    router.use('/managers', verifyToken, verifySession, managersRoutes);
    router.use('/employees', verifyToken, verifySession, employeesRoutes);
    
    // Use the router under the '/api/v1' base path
    app.use('/api/v1', router);
};

module.exports = configureRoutes;