const { sanitizeImageFile } = require("../../utilities/sanitizeImageUtil");
const asyncHandler = require("../utils/asyncHandler");
const {generateUniqueFilename} = require("../../utilities/filenameUtil");
const {uploadEmployeeProfileImageToS3} = require("../../database/s3/uploadS3");

/**
 * Middleware to sanitize uploaded images.
 */
const sanitizeImageMiddleware = asyncHandler(async (req, res, next) => {
    if (req.file) {
        try {
            const { sanitizedImagePath, thumbnailPath, imageType, imageSize } = await sanitizeImageFile(req.file.path, {
                width: 1024,
                quality: 80,
                createThumbnail: true, // Create a thumbnail
                thumbnailWidth: 150,   // Set thumbnail width
            });
            
            req.file.sanitizedImagePath = sanitizedImagePath; // Path to the sanitized image
            req.file.thumbnailPath = thumbnailPath; // Path to the thumbnail
            req.file.imageType = imageType; // Image type after sanitization
            req.file.imageSize = imageSize; // Image size after sanitization
            
            if (process.env.NODE_ENV === 'production') {
                // Upload to S3
                const uniqueFilename = generateUniqueFilename(req.file.originalname); // Generate a unique filename
                req.file.s3ImagePath = await uploadEmployeeProfileImageToS3(req.file.path, uniqueFilename);
                
                if (thumbnailPath) {
                    const uniqueThumbnailFilename = generateUniqueFilename('thumbnail-' + req.file.originalname);
                    req.file.s3ThumbnailPath = await uploadEmployeeProfileImageToS3(thumbnailPath, uniqueThumbnailFilename);
                }
                req.file.imageType = imageType;
            } else {
                // For development, store locally
                req.file.s3ImagePath = sanitizedImagePath;
                req.file.thumbnailPath = thumbnailPath;
            }
            
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

module.exports = sanitizeImageMiddleware;