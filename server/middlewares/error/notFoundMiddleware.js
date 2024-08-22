const {CustomError} = require("./errorHandler");
const asyncHandler = require("../utlis/asyncHandler");

// 404 Error Handling Middleware
const notFoundHandler = asyncHandler((req, res, next) => {
    // Capture the HTTP method and URL that led to the 404 error
    const details = {
        method: req.method,
        url: req.originalUrl,
        message: 'The requested resource was not found',
        timestamp: new Date().toISOString()
    };
    
    // Pass a 404 error to the error handling middleware
    next(new CustomError(404, 'Not Found', details));
});

module.exports = notFoundHandler;