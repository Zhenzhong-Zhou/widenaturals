const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const {generateUniqueFilename} = require('../utilities/fileUtils');
const logger = require('./logger');

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
        await fs.mkdir(directory, {recursive: true});
    } catch (error) {
        throw new Error(`Failed to create directory: ${error.message}`);
    }
};

// Storage configuration based on environment
let storage;
if (process.env.NODE_ENV === 'production') {
    // Use memory storage for production
    storage = multer.memoryStorage();
} else {
    // Use local storage in development or other non-production environments
    storage = multer.diskStorage({
        destination: async (req, file, cb) => {
            try {
                const uploadPath = determineUploadPath(req);
                await ensureDirectoryExists(uploadPath);
                cb(null, uploadPath);
            } catch (error) {
                cb(new Error(`Error creating upload directory: ${error.message}`));
            }
        },
        filename: (req, file, cb) => {
            try {
                const uniqueFilename = generateUniqueFilename(file.originalname);
                cb(null, uniqueFilename);
            } catch (error) {
                logger.error('Error generating unique filename:', error);
                cb(new Error(`Error generating unique filename: ${error.message}`));
            }
        }
    });
}

module.exports = {
    storage,
    ensureDirectoryExists,
    determineUploadPath,
};