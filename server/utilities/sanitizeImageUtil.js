const sharp = require("sharp");
const { promises: fs } = require("node:fs");
const {CustomError} = require("../middlewares/error/errorHandler");
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
        // Resize and convert to JPEG
        const buffer = await sharp(filePath)
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
        await fs.writeFile(filePath, buffer);
        
        let thumbnailPath = null;
        
        // Optionally create a thumbnail
        if (options.createThumbnail) {
            thumbnailPath = `${filePath}-thumbnail.jpeg`;
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