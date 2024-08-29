const path = require('path');
const fs = require('fs/promises');
const { errorHandler, CustomError} = require('../middlewares/error/errorHandler');
const { getIDFromMap} = require("../utilities/idUtils");
const { getRoleDetails } = require("./roleService");
const logger = require('../utilities/logger');
const { logAuditAction } = require("../utilities/log/auditLogger");
const {canAssignRole} = require("../dal/roles/roleDAL");
const {fetchEmployeesWithImages, fetchEmployeeById, fetchEmployeeByFullName, updateEmployeeProfileImage,
    insertEmployeeProfileImage, getEmployeeProfileImage, insertEmployee
} = require("../dal/employees/employeeDAL");
const {generateUniqueFilename} = require("../utilities/fileUtils");
const {uploadEmployeeProfileImageToS3} = require("../database/s3/uploadS3");

const createEmployeeHandler = async ({ createdBy, firstName, lastName, email, phoneNumber, password, jobTitle, roleId, hashedRoleId, permissions, isInitialAdmin = false }) => {
    // Only allow bypassing validation if this is the initial admin creation
    if (!isInitialAdmin) {
        if (!permissions || !createdBy) {
            throw new Error("Permissions and createdBy must be provided for non-initial admin creation.");
        }
        
        // Fetch the original role ID from the hashed role ID
        const originalRoleId = await getIDFromMap(hashedRoleId, 'roles');
        
        // Fetch the role details based on the original role ID
        const roleDetails = await getRoleDetails({ id: originalRoleId });
        const roleName = roleDetails.name;
        
        // Validate if the role can be assigned based on the user's role and permissions
        const isAssignable = await canAssignRole(roleId, roleName, permissions);
        
        if (!isAssignable) {
            throw new Error("Assignment denied: You cannot assign this role or perform this action.");
        }
    } else {
        logger.info("Bypassing role assignment validation for initial admin creation");
    }
    
    // Proceed with creating the employee
    return await insertEmployee({
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        jobTitle: jobTitle || 'Employee',
        roleId,
        createdBy
    });
};

const getAllEmployeesService = async (originalEmployeeId, page, limit, offset) => {
    try {
        // Fetch employees with images from the data access layer (DAL)
        const { employees, totalCount } = await fetchEmployeesWithImages(limit, offset);
        
        // Determine the result status (success or empty)
        const resultStatus = (employees && employees.length > 0) ? 'success' : 'empty';
        
        // Log the query result to the audit log
        await logAuditAction(
            'employees_overview',
            'employees',
            'select',
            originalEmployeeId,
            originalEmployeeId,
            null,  // No old data for a SELECT operation
            { page, limit, offset, result: resultStatus }
        );
        
        // Return the fetched employees and the total count
        return {
            employees: employees || [],  // Ensure the data is always an array
            totalCount: totalCount || 0,  // Default to 0 if no employees found
            originalEmployeeId
        };
    } catch (error) {
        // Log any error that occurs during the process
        logger.error('Error in getAllEmployeesService', {
            context: 'getAllEmployeesService',
            error: error.message,
            stack: error.stack,
            employeeId: originalEmployeeId
        });
        
        // Re-throw the error to be handled by the calling function
        throw errorHandler(500, 'Internal Server Error', error.message);
    }
};

const getEmployeeById = async (employeeId) => {
    try {
        const employee = await fetchEmployeeById(employeeId);
        
        if (employee) {
            // Format the created_at and updated_at dates
            employee.created_at = new Date(employee.created_at).toLocaleDateString();
            employee.updated_at = new Date(employee.updated_at).toLocaleDateString();
        }
        
        return employee;
    } catch (error) {
        logger.error('Error in service fetching employee data by using employee id:', error);
        throw new Error('Error in service fetching employee data by using employee id');
    }
};

const getEmployeeByFullName = async (employeeName) => {
    try {
        return await fetchEmployeeByFullName(employeeName);
    } catch (error) {
        // Log the detailed error message
        logger.error('Error in service fetching employee data by using employee name:', error);
        
        // Throw a custom error with a more specific message
        throw new CustomError('Failed to fetch employee data by employee name', 500, error);
    }
};

const uploadProfileImageService = async (employeeId, file) => {
    let imagePath = '';
    const imageType = file.imageType;
    let thumbnailPath = '';
    const imageHash = ''; // Placeholder for hashing logic
    let imageSize = file.imageSize; // Use the size from the middleware directly
    
    if (process.env.NODE_ENV === 'production') {
        // Upload to S3
        const uniqueFilename = generateUniqueFilename(file.originalname);
        imagePath = await uploadEmployeeProfileImageToS3(file.path, uniqueFilename);
        
        if (thumbnailPath) {
            const uniqueThumbnailFilename = generateUniqueFilename('thumbnail-' + file.originalname);
            thumbnailPath = await uploadEmployeeProfileImageToS3(thumbnailPath, uniqueThumbnailFilename);
        }
    } else {
        // Development: use local storage
        const sanitizedPath = path.basename(file.sanitizedImagePath); // Get the basename to avoid path traversal issues
        const uploadsDir = path.resolve(__dirname, '../../server/uploads/profile');
        imagePath = path.resolve(uploadsDir, sanitizedPath); // Resolve against the base uploads directory
        // Ensure the path is within the uploads directory
        if (!imagePath.startsWith(uploadsDir)) {
            logger.error('Invalid file path detected:', imagePath);
            throw new Error('Invalid file path');
        }
        
        // Check if file exists
        try {
            await fs.access(imagePath); // Check if the file exists
        } catch (err) {
            logger.error('File not found:', imagePath);
            throw new Error('Invalid file path');
        }
        
        // Get file stats safely
        const imageStats = await fs.stat(imagePath);
        imageSize = imageStats.size;
        thumbnailPath = file.thumbnailPath;
    }
    
    const existingImage = await getEmployeeProfileImage(employeeId);
    
    if (existingImage.length > 0) {
        await updateEmployeeProfileImage(employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash);
        return {
            status: 200,
            message: 'Profile image updated successfully',
        };
    } else {
        await insertEmployeeProfileImage(employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash);
        return {
            status: 201,
            message: 'Profile image uploaded successfully',
        };
    }
};

module.exports = { createEmployeeHandler, getAllEmployeesService, getEmployeeById, getEmployeeByFullName, uploadProfileImageService };