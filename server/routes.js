const welcomeRoutes = require('./routes/welcome');
const healthRoutes = require('./routes/health');

const configureRoutes = (app) => {
    app.use('/api/v1/welcome', welcomeRoutes);
    app.use('/api/v1/health', healthRoutes);
};

module.exports = { configureRoutes };