const sharp = require("sharp");
const { promises: fs } = require("node:fs");
const path = require("path");

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
        
        // Determine the image type based on the processing format
        const imageType = 'image/jpeg';  // Since we are converting to JPEG, set it to 'image/jpeg'
        
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
        
        // Return paths and metadata
        return { thumbnailPath, imageType };
        
    } catch (error) {
        console.error(`Error sanitizing image: ${error.message}`);
        throw new Error(`Error sanitizing image: ${error.message}`);
    }
};

module.exports = { sanitizeImageFile };