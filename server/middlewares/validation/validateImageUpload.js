const {errorHandler} = require("../error/errorHandler");
const validateImage = (req, res, next) => {
    const {file} = req;
    if (!file) {
        errorHandler(400, 'No file uploaded');
    }
    
    const filetypes = /jpeg|jpg|png|gif|webp|bmp/;
    const extname = filetypes.test(file.mimetype.toLowerCase());
    
    if (!extname) {
        errorHandler(400, 'Invalid file type. Only images are allowed.');
    }
    
    next();
};

module.exports = validateImage;