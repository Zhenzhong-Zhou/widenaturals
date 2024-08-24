const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const { generateUniqueFilename } = require('../utilities/filenameUtil');

// Function to determine upload path based on request URL
const determineUploadPath = (req) => {
    if (req.url.includes('/profile')) {
        return path.join(__dirname, '../uploads/profile');
    } else if (req.url.includes('/product')) {
        return path.join(__dirname, '../uploads/products');
    } else {
        return path.join(__dirname, '../uploads/others');
    }
};

// Asynchronous function to ensure the directory exists
const ensureDirectoryExists = async (directory) => {
    try {
        await fs.mkdir(directory, { recursive: true });
    } catch (error) {
        throw new Error(`Failed to create directory: ${error.message}`);
    }
};

// Multer storage configuration based on environment
let storage;
if (process.env.NODE_ENV === 'production') {
    // Use a custom storage engine that uploads to S3
    storage = multer.memoryStorage(); // Store files temporarily in memory
} else {
    // Use local storage in development or other non-production environments
    storage = multer.diskStorage({
        destination: async (req, file, cb) => {
            try {
                const uploadPath = determineUploadPath(req);
                await ensureDirectoryExists(uploadPath); // Ensure directory exists
                cb(null, uploadPath);
            } catch (error) {
                cb(new Error(`Error creating upload directory: ${error.message}`));
            }
        },
        filename: (req, file, cb) => {
            const uniqueFilename = generateUniqueFilename(file.originalname); // Use unique filename generator
            cb(null, uniqueFilename);
        }
    });
}

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
            cb(new Error('Error: Images Only!'));
        }
    }
});

module.exports = {
    upload,
};