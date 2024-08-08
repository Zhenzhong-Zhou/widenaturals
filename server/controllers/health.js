const asyncHandler = require("../middlewares/asyncHandler");
const db = require("../database/database");
const logger = require("../utilities/logger");

const health = asyncHandler(async (req, res) => {
    try {
        const healthStatus = await  db.checkHealth();
        if (healthStatus.status === 'UP') {
            res.status(200).json({ status: 'UP' });
        } else {
            res.status(500).json({ status: 'DOWN', message: healthStatus.message });
        }
    } catch (error) {
        logger.error('Health check route failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

module.exports = health;