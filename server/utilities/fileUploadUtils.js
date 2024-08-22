const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Multer storage configuration based on environment
let storage;
if (process.env.NODE_ENV === 'production') {
    // Use a custom storage engine that uploads to S3
    storage = multer.memoryStorage(); // Store files temporarily in memory
} else {
    // Use local storage in development or other non-production environments
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            let uploadPath;
            
            // Determine the upload path based on the file type or request
            if (req.url.includes('/profile')) {
                uploadPath = path.join(__dirname, '../uploads/profile');
            } else if (req.url.includes('/product')) {
                uploadPath = path.join(__dirname, '../uploads/products');
            } else {
                uploadPath = path.join(__dirname, '../uploads/others');
            }
            
            // Create the directory if it doesn't exist
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const filename = `${file.fieldname}-${Date.now()}${ext}`;
            cb(null, filename);
        }
    });
}

// Multer upload configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 600 * 1024 // 600KB limit per image
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp|bmp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Images Only!'));
        }
    }
});

// Sharp processing for resizing images
const processImage = async (filePath, width, height) => {
    try {
        let outputPath = `${filePath}-resized`;
        let fileSize = 0;
        let quality = 90; // Start with 90% quality
        
        do {
            // Resize and compress the image
            await sharp(filePath)
                .resize(width, height)
                .jpeg({ quality })
                .toFile(outputPath);
            
            // Get the file size
            const stats = fs.statSync(outputPath);
            fileSize = stats.size;
            
            // If the file is larger than 600KB, reduce the quality
            if (fileSize > 600 * 1024) {
                quality -= 10; // Reduce quality by 10%
            }
        } while (fileSize > 600 * 1024 && quality > 10);
        
        // Optionally, delete the original file if not needed
        fs.unlinkSync(filePath);
        
        if (fileSize > 600 * 1024) {
            throw new Error('Unable to compress the image to the desired size');
        }
    } catch (error) {
        throw new Error('Error processing image: ' + error.message);
    }
};

module.exports = {
    upload,
    processImage,
};