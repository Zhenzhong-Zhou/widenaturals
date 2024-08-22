const {MulterError} = require("multer");
const {error} = require("../../utilities/logger");

const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof MulterError) {
        error('Multer error', { error: err.message });
        return res.status(400).json({ message: 'File upload error: ' + err.message });
    }
    next(err);
};

module.exports = multerErrorHandler;