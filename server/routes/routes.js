const express = require('express');
const welcomeRoutes = require('../routes/welcome');
const healthRoutes = require('../routes/health');

const configureRoutes = (app) => {
    const router = express.Router();
    
    // Mount specific route modules
    router.use('/welcome', welcomeRoutes);
    router.use('/health', healthRoutes);
    
    // Define additional routes directly
    router.get('/status', (req, res) => {
        res.json({ status: 'OK' });
    });
    
    // Use the router under the '/api/v1' base path
    app.use('/api/v1', router);
};

module.exports = configureRoutes;