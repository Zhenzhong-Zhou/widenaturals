const {sanitizeImageFile} = require("../../utilities/sanitizeImageUtil");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Middleware to sanitize uploaded images.
 */
const sanitizeImageMiddleware = asyncHandler(async (req, res, next) => {
    if (req.file) {
        try {
            const {sanitizedImagePath, thumbnailPath, imageType, imageSize} = await sanitizeImageFile(req.file.path, {
                width: 1024,
                quality: 80,
                createThumbnail: true, // Create a thumbnail
                thumbnailWidth: 150,   // Set thumbnail width
            });
            
            req.file.sanitizedImagePath = sanitizedImagePath; // Path to the sanitized image
            req.file.thumbnailPath = thumbnailPath; // Path to the thumbnail
            req.file.imageType = imageType; // Image type after sanitization
            req.file.imageSize = imageSize; // Image size after sanitization
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

module.exports = sanitizeImageMiddleware;