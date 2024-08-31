const sharp = require("sharp");
const {promises: fs} = require("node:fs");
const path = require("path");
const {CustomError} = require("../middlewares/error/errorHandler");
const logger = require("../utilities/logger");

/**
 * Sanitizes an image by resizing, converting to JPEG format, and optionally creating a thumbnail.
 *
 * @param {string} filePath - The path of the file to sanitize.
 * @param {object} options - Options for resizing, quality, and thumbnail generation.
 * @returns {Promise<object>} - An object containing paths and metadata of processed images.
 */
const sanitizeImageFile = async (filePath, options = {
    width: 1024,
    quality: 80,
    createThumbnail: false,
    thumbnailWidth: 150
}) => {
    try {
        // Ensure the filePath is resolved within a secure directory
        const UPLOADS_DIR = path.resolve(__dirname, '../uploads'); // Define the secure base directory
        const resolvedPath = path.resolve(UPLOADS_DIR, filePath); // Resolve the full file path within UPLOADS_DIR
        
        // Validate that the resolved path is still within the UPLOADS_DIR
        if (!resolvedPath.startsWith(UPLOADS_DIR)) {
            logger.error('Invalid file path detected, path traversal attempt prevented.', {resolvedPath});
            throw new CustomError(400, 'Invalid file path');
        }
        
        // Proceed with image processing using sharp
        const buffer = await sharp(resolvedPath)
            .resize({width: options.width, fit: sharp.fit.inside}) // Resize image while maintaining aspect ratio
            .toFormat('jpeg') // Convert image to JPEG format
            .jpeg({quality: options.quality}) // Adjust image quality
            .toBuffer();
        
        // Check the size of the processed image
        const stats = await sharp(buffer).metadata();
        
        // If the processed image size is below the acceptable threshold, throw an error
        if (stats.size < 30720) {
            logger.warn('Processed image size is below the acceptable threshold of 30KB.', {imageSize: stats.size});
            throw new CustomError(400, 'Processed image size is below the acceptable threshold of 30KB.');
        }
        
        // Overwrite the original file with the sanitized image
        await fs.writeFile(resolvedPath, buffer);
        
        // Get the file size of the sanitized image
        const imageStats = await fs.stat(resolvedPath);
        const imageSize = imageStats.size;
        
        let thumbnailPath = null;
        
        // Optionally create a thumbnail
        if (options.createThumbnail) {
            thumbnailPath = `${resolvedPath}-thumbnail.jpeg`;
            await sharp(buffer)
                .resize(options.thumbnailWidth)
                .jpeg({quality: 80}) // Set thumbnail quality
                .toFile(thumbnailPath);
        }
        
        // Define image type based on the processing format
        const imageType = 'image/jpeg';  // The image is converted to JPEG
        
        // Return the paths and metadata of the processed images
        return {sanitizedImagePath: resolvedPath, thumbnailPath, imageType, imageSize};
        
    } catch (error) {
        logger.error(`Error sanitizing image: ${error.message}`);
        throw new Error(`Error sanitizing image: ${error.message}`);
    }
};

module.exports = {sanitizeImageFile};