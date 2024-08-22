const {statSync} = require("node:fs");
const asyncHandler = require("../middlewares/asyncHandler");
const {query, incrementOperations, decrementOperations} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");
const {getAllEmployeesService} = require("../services/employeeService");
const {getIDFromMap} = require("../utilities/idUtils");
const {uploadEmployeeProfileImageToS3} = require("../database/s3/uploadS3");
const {processImage, generateUniqueFilename, sanitizeFilePath, generateThumbnail} = require("../utilities/fileUploadUtils");

const getAllEmployees = asyncHandler(async (req, res) => {
    try {
        const hashedEmployeeId = req.employee.sub;
        const { page, limit, offset } = getPagination(req);
        
        // Call the service layer to handle the request
        const { employees, totalCount, originalEmployeeId } = await getAllEmployeesService(hashedEmployeeId, page, limit, offset);
        
        // Log the success info
        logger.info('Successfully fetched employees data', {
            context: 'employees_overview',
            employeeId: originalEmployeeId,
            resultCount: totalCount
        });
        
        // Respond with employees data including images if available
        res.status(200).json({
            status: 'success',
            currentPage: page,
            itemsPerPage: limit,
            totalItems: totalCount,
            employees
        });
    } catch (error) {
        // Handle critical errors such as missing audit_log table
        logger.error('Critical failure in getAllEmployees', {
            context: 'employees_overview',
            error: error.message,
            stack: error.stack,
            employeeId: req.employee ? req.employee.sub : 'Unknown'
        });
        errorHandler(500, 'Internal Server Error', error.message);
    }
});

const getEmployeeById = async (req, res, next) => {
    try {
        const employees = await query(`
            SELECT e.id, e.first_name, e.last_name, e.email,
                epi.image_path, epi.image_type, epi.thumbnail_path
            FROM employees e
            LEFT JOIN employee_profile_images epi ON e.id = epi.employee_id
            WHERE e.id = $1;`);
       
        
        
        res.status(200).send("")
    } catch (error) {
        next(errorHandler(500, "Internal Server Error"));
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        res.status(200).send("")
    } catch (error) {
        next(errorHandler(500, "Internal Server Error"));
    }
};

const uploadEmployeeProfileImage = asyncHandler(async (req, res, next) => {
    try {
        const hashedEmployeeId = req.employee.sub;
        const employeeId = await getIDFromMap(hashedEmployeeId, 'employees');
        
        await query('BEGIN');
        incrementOperations();
        
        // Generate a unique filename and sanitize the file path
        const uniqueFilename = generateUniqueFilename(req.file.originalname);
        const sanitizedFilePath = sanitizeFilePath(req.file.path);
        
        let imagePath, imageType, imageSize, imageHash = '', alt_text = '';
        
        // Resize and process the image, and overwrite the file with the processed version
        await processImage(req.file.path, 800, 800);  // Assuming 800x800 max size for profile images
        
        // todo how to use
        // todo ask relative function and file follow best practice or not?
        // todo separate to server and dal
        // Generate a thumbnail from the processed image
        const thumbnailPath = await generateThumbnail(sanitizedFilePath, 150, 150);
        
        // After processing, update image details based on the processed file
        const processedFileStats = statSync(req.file.path);
        imageType = 'image/jpeg';
        imageSize = processedFileStats.size;
        
        if (process.env.NODE_ENV === 'production') {
            // Upload to S3 and get the path
            imagePath = await uploadEmployeeProfileImageToS3(req.file, uniqueFilename);
        } else {
            // If in development, use the local file path
            imagePath = req.file.path;
        }
        
        // Optional: Handle thumbnail generation and image hashing
        // todo i have hashed id and process id
       
        imageHash = ''; // Assuming you'll generate or calculate the hash separately
        alt_text = '';
        
        // Check if the employee already has a profile image
        const existingImage = await query('SELECT id FROM employee_profile_images WHERE employee_id = $1', [employeeId]);
        
        if (existingImage.length > 0) {
            // Update the existing image entry
            await query(`
                UPDATE employee_profile_images
                SET image_path = $1, image_type = $2, image_size = $3, thumbnail_path = $4, image_hash = $5, updated_at = NOW()
                WHERE employee_id = $6
            `, [imagePath, imageType, imageSize, thumbnailPath, imageHash, employeeId]);
            
            await query('COMMIT');
            res.status(200).json({ message: 'Profile image updated successfully', imagePath });
        } else {
            // Insert a new image entry
            await query(`
                INSERT INTO employee_profile_images (employee_id, image_path, image_type, image_size, thumbnail_path, image_hash)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash]);
            
            await query('COMMIT');
            res.status(201).json({ message: 'Profile image uploaded successfully', imagePath });
        }
    } catch (error) {
        await query('ROLLBACK');
        logger.error('Failed to upload or update profile image', { error: error.message });
        next(errorHandler(500, 'Internal Server Error', error.message));
    } finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
});

module.exports = {getAllEmployees, getEmployeeById, updateEmployee, uploadEmployeeProfileImage};