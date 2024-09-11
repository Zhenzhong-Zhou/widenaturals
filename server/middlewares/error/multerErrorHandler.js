const {MulterError} = require("multer");
const {error} = require("../../utilities/logger");
const {errorHandler} = require("./errorHandler");

const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof MulterError) {
        error('Multer error', {error: err.message});
        errorHandler(400, 'File upload error: ' + err.message);
    }
    next(err);
};

module.exports = multerErrorHandler;