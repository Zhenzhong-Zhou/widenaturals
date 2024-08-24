const { sanitizeImageFile } = require("../../utilities/sanitizeImageUtil");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Middleware to sanitize uploaded images.
 */
const sanitizeImageMiddleware = asyncHandler(async (req, res, next) => {
    if (req.file) {
        try {
            const { thumbnailPath, imageType } = await sanitizeImageFile(req.file.path, {
                width: 1024,
                quality: 80,
                createThumbnail: true, // Assume you want to create a thumbnail
                thumbnailWidth: 150,   // Set thumbnail width
            });
            
            // Attach the processed data to the request object
            req.file.imageType = imageType;
            req.file.thumbnailPath = thumbnailPath;
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

module.exports = sanitizeImageMiddleware;