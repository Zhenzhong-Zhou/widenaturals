const path = require('path');

/**
 * Generates a unique filename by appending a timestamp and a random string to the original name.
 *
 * @param {string} originalName - The original filename.
 * @returns {string} - A unique filename.
 */
const generateUniqueFilename = (originalName) => {
    const ext = path.extname(originalName); // Extract the file extension
    const basename = path.basename(originalName, ext); // Extract the base name
    const timestamp = Date.now(); // Current timestamp
    const randomStr = Math.random().toString(36).slice(2, 11); // Generate a random string
    
    return `${basename}-${timestamp}-${randomStr}${ext}`; // Construct the unique filename
};

// Utility function for handling local storage (development)
const handleLocalStorage = (filePath) => {
    const resolvedPath = path.resolve(__dirname, '../../uploads', filePath);
    if (!resolvedPath.startsWith(path.resolve(__dirname, '../../uploads'))) {
        throw new Error('Invalid file path');
    }
    
    return resolvedPath; // Just return the sanitized path for local development
};

module.exports = {generateUniqueFilename, handleLocalStorage};