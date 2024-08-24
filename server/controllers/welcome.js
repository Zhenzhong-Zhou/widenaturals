const asyncHandler = require("../middlewares/utils/asyncHandler");
const { errorHandler } = require("../middlewares/error/errorHandler");
const logger = require("../utilities/logger");

const welcome = asyncHandler(async (req, res, next) => {
    try {
        // Log the access of the welcome message
        logger.info('Welcome message accessed', { ipAddress: req.ip, userAgent: req.get('User-Agent') });
        
        // Customizable welcome message
        const welcomeMessage = "Welcome to the server of WIDE Naturals INC. Enterprise Resource Planning.";
        
        // Send the welcome message with appropriate content-type
        res.status(200).type('text/plain').send(welcomeMessage);
    } catch (error) {
        // Log the error before passing it to the error handler
        logger.error('Error serving welcome message', { error: error.message, stack: error.stack });
        next(errorHandler(500, "Internal Server Error"));
    }
});

module.exports = welcome;