const sharp = require("sharp");
const { promises: fs } = require("node:fs");
const path = require("path");
const { CustomError } = require("../middlewares/error/errorHandler");
const logger = require("../utilities/logger");

/**
 * Sanitizes an image by resizing, converting to JPEG format, and optionally creating a thumbnail.
 *
 * @param {string} filePath - The path of the file to sanitize.
 * @param {object} options - Options for resizing, quality, and thumbnail generation.
 * @returns {Promise<object>} - An object containing paths and metadata of processed images.
 */
const sanitizeImageFile = async (filePath, options = { width: 1024, quality: 80, createThumbnail: false, thumbnailWidth: 150 }) => {
    try {
        // Ensure the filePath is in a secure directory
        const UPLOADS_DIR = path.resolve(__dirname, '../uploads'); // Define a secure directory
        const resolvedPath = path.resolve(UPLOADS_DIR, filePath); // Resolve filePath within this directory
        
        // Check if the resolved path is still within the UPLOADS_DIR
        if (!resolvedPath.startsWith(UPLOADS_DIR)) {
            throw new CustomError(400, 'Invalid file path');
        }
        
        // Resize and convert to JPEG
        const buffer = await sharp(resolvedPath)
            .resize({ width: options.width, fit: sharp.fit.inside }) // Set max width, maintaining aspect ratio
            .toFormat('jpeg') // Convert output to JPEG
            .jpeg({ quality: options.quality }) // Adjust the quality
            .toBuffer();
        
        // Get stats to check the file size after processing
        const stats = await sharp(buffer).metadata();
        
        // Throw error if image size is below the acceptable threshold
        if (stats.size < 30720) {
            logger.warn('Processed image size is below the acceptable threshold of 50KB.', { imageSize: stats.size });
            throw new CustomError(400, 'Processed image size is below the acceptable threshold of 50KB.', { imageSize: stats.size });
        }
        
        // Overwrite the file with the sanitized image asynchronously
        await fs.writeFile(resolvedPath, buffer);
        
        let thumbnailPath = null;
        
        // Optionally create a thumbnail
        if (options.createThumbnail) {
            thumbnailPath = `${resolvedPath}-thumbnail.jpeg`;
            await sharp(buffer)
                .resize(options.thumbnailWidth)
                .jpeg({ quality: 80 }) // Optionally adjust thumbnail quality
                .toFile(thumbnailPath);
        }
        
        // Determine the image type based on the processing format
        const imageType = 'image/jpeg';  // Since we are converting to JPEG, set it to 'image/jpeg'
        
        // Return paths and metadata
        return { thumbnailPath, imageType };
        
    } catch (error) {
        logger.error(`Error sanitizing image: ${error.message}`);
        throw new Error(`Error sanitizing image: ${error.message}`);
    }
};

module.exports = { sanitizeImageFile };