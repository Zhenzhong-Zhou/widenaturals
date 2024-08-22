const sharp = require("sharp");
const { writeFileSync } = require("node:fs");
const asyncHandler = require("../utlis/asyncHandler");

const sanitizeImage = asyncHandler(async (req, res, next) => {
    try {
        const { file } = req;
        
        const buffer = await sharp(file.path)
            .resize({ width: 1024, fit: sharp.fit.inside }) // Set max width if needed, maintaining aspect ratio
            .toFormat('jpeg') // Ensure the output is a JPEG
            .jpeg({ quality: 80 }) // Adjust the quality as needed
            .toBuffer();
        
        // Overwrite the file with the sanitized image
        writeFileSync(file.path, buffer);
        
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = sanitizeImage;