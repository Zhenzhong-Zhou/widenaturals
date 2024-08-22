const logger = require('../../utilities/logger');

class CustomError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}

const errorHandler = (statusCode, message, details = null) => {
    throw new CustomError(statusCode, message, details);
};

const handleErrors = (err, req, res, next) => {
    if (err instanceof CustomError) {
        logger.error(`Error processing request ${req.method} ${req.url}`, {
            context: 'http_error',
            error: err.message,
            stack: err.stack,
            statusCode: err.statusCode,
            details: err.details
        });
        
        return res.status(err.statusCode).json({
            status: 'error',
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            details: err.details
        });
    }
    
    // Log non-custom errors safely
    logger.error(`Error processing request ${req.method} ${req.url}`, {
        context: 'http_error',
        error: err.message,
        stack: err.stack
    });
    
    res.status(500).json({
        status: 'error',
        success: false,
        statusCode: 500,
        message: "An internal server error occurred."
    });
};

module.exports = {
    CustomError,
    errorHandler,
    handleErrors
};