const { promises: fs } = require('fs');
const path = require("path");
const asyncHandler = require("../middlewares/utils/asyncHandler");
const {query, incrementOperations, decrementOperations} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/error/errorHandler");
const {getAllEmployeesService} = require("../services/employeeService");
const {uploadEmployeeProfileImageToS3} = require("../database/s3/uploadS3");

const getAllEmployees = asyncHandler(async (req, res) => {
    try {
        const employeeId = req.employee.originalEmployeeId;
        const { page, limit, offset } = getPagination(req);
        
        // Call the service layer to handle the request
        const { employees, totalCount, originalEmployeeId } = await getAllEmployeesService(employeeId, page, limit, offset);
        
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
            employeeId: req.employee ? req.employee.originalEmployeeId : 'Unknown'
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

/**
 * Uploads or updates an employee's profile image.
 */
const uploadEmployeeProfileImage = asyncHandler(async (req, res) => {
    const employeeId = req.employee.originalEmployeeId;
    
    if (!req.file) {
        return errorHandler(400, 'No file uploaded');
    }
    
    const filePath = path.resolve(req.file.path);
    const imageType = req.file.mimetype;
    const thumbnailPath = req.file.thumbnailPath;
    
    try {
        
        // Start a transaction
        await query('BEGIN');
        incrementOperations();
        
        // todo how to use
        // todo ask relative function and file follow best practice or not?
        // todo separate to server and dal
        let imagePath;
        
        // Upload to S3 or use local path
        if (process.env.NODE_ENV === 'production') {
            imagePath = await uploadEmployeeProfileImageToS3(req.file, filePath);
        } else {
            imagePath = filePath;
        }
        
        // Generate image metadata
        const imageStats = await fs.stat(filePath);
        const imageSize = imageStats.size;
        const imageHash = ''; // Placeholder for hashing logic
        const altText = ''; // Placeholder for alternative text logic
        
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
            res.status(200).json({ message: 'Profile image updated successfully' });
        } else {
            // Insert a new image entry
            await query(`
                INSERT INTO employee_profile_images (employee_id, image_path, image_type, image_size, thumbnail_path, image_hash)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash]);
            
            await query('COMMIT');
            res.status(201).json({ message: 'Profile image uploaded successfully' });
        }
    } catch (error) {
        await query('ROLLBACK');
        logger.error('Failed to upload or update profile image', { error: error.message });
        errorHandler(500, 'Internal Server Error', error.message);
    } finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
});

module.exports = {getAllEmployees, getEmployeeById, updateEmployee, uploadEmployeeProfileImage};