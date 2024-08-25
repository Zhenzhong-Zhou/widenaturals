const multer = require('multer');
const path = require('path');
const {storage} = require("../../utilities/uploadConfig");

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit per image
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp|bmp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Only image files are allowed!'));
        }
    }
});

module.exports = {
    upload,
};