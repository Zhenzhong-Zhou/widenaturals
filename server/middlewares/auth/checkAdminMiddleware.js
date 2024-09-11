const {checkAdminExists} = require('../../utilities/validators/validateEmployee');
const logger = require('../../utilities/logger');
const {errorHandler} = require("../error/errorHandler");

const checkNoAdminsExist = async (req, res, next) => {
    try {
        const adminExists = await checkAdminExists();
        
        if (adminExists) {
            logger.warn('Admin creation attempt blocked: Admin already exists.', {
                context: 'admin_creation',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });
            
            errorHandler(404, 'Not Found');
        }
        
        next();
    } catch (error) {
        // Log the error for monitoring and debugging
        logger.error('Error checking for existing admin', {
            context: 'admin_creation',
            error: error.message,
            stack: error.stack,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });
        
        // Handle errors that may occur during the check
        next(error);
    }
};

module.exports = {checkNoAdminsExist};