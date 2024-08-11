const asyncHandler = require("../middlewares/asyncHandler");
const db = require("../database/database");
const logger = require("../utilities/logger");

const health = asyncHandler(async (req, res) => {
    try {
        const healthStatus = await db.checkHealth();
        
        if (healthStatus.status === 'UP') {
            return res.status(200).json({status: 'UP', message: 'Health status is UP'});
        } else {
            // Use 503 for service unavailable instead of 500 for a more accurate status
            return res.status(503).json({status: 'DOWN', message: healthStatus.message});
        }
    } catch (error) {
        logger.error('Health check route failed', {error: error.message});
        // Use 500 if there's an error checking health, which indicates an internal server issue
        return res.status(500).json({status: 'error', message: 'Internal Server Error'});
    }
});

module.exports = health;