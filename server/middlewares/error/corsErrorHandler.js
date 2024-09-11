const logger = require('../../utilities/logger');
const {CustomError} = require('../error/errorHandler');

const corsErrorHandler = (err, req, res, next) => {
    if (err instanceof CustomError && err.statusCode === 403) {
        logger.error('CORS error', {
            context: 'CORS',
            origin: req.headers.origin,
            error: err.message,
        });
        
        // Directly send the error response without throwing a new error
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden by CORS',
        });
    }
    
    // Pass the error to the next middleware if it's not a CORS-related error
    next(err);
};

module.exports = corsErrorHandler;