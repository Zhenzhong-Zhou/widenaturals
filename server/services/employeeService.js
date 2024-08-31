const path = require('path');
const fs = require('fs/promises');
const {errorHandler, CustomError} = require('../middlewares/error/errorHandler');
const {getIDFromMap} = require("../utilities/idUtils");
const {getRoleDetails} = require("./roleService");
const logger = require('../utilities/logger');
const {logAuditAction} = require("../utilities/log/auditLogger");
const {canAssignRole} = require("../dal/roles/roleDAL");
const {
    fetchEmployeesWithImages, fetchEmployeeProfileById, fetchEmployeeByFullName, updateEmployeeProfileImage,
    insertEmployeeProfileImage, getEmployeeProfileImage, insertEmployee
} = require("../dal/employees/employeeDAL");
const {generateUniqueFilename} = require("../utilities/fileUtils");
const {uploadEmployeeProfileImageToS3} = require("../database/s3/uploadS3");

const createEmployeeHandler = async ({
                                         createdBy,
                                         firstName,
                                         lastName,
                                         email,
                                         phoneNumber,
                                         password,
                                         jobTitle,
                                         roleId,
                                         hashedRoleId,
                                         permissions,
                                         isInitialAdmin = false
                                     }) => {
    // Only allow bypassing validation if this is the initial admin creation
    if (!isInitialAdmin) {
        if (!permissions || !createdBy) {
            throw new Error("Permissions and createdBy must be provided for non-initial admin creation.");
        }
        
        // Fetch the original role ID from the hashed role ID
        const originalRoleId = await getIDFromMap(hashedRoleId, 'roles');
        
        // Fetch the role details based on the original role ID
        const roleDetails = await getRoleDetails({id: originalRoleId});
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
        const {employees, totalCount} = await fetchEmployeesWithImages(limit, offset);
        
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
            {page, limit, offset, result: resultStatus}
        );
        
        // Return the fetched employees and the total count
        return {
            employees: employees || [],  // Ensure the data is always an array
            totalCount: totalCount || 0,  // Default to 0 if no employees found
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

const getEmployeeProfileById = async (employeeId) => {
    try {
        // Fetch employee data
        const employee = await fetchEmployeeProfileById(employeeId);
        
        // If no employee data is returned, handle the missing data scenario
        if (!employee) {
            logger.warn(`Employee with ID ${employeeId} not found.`);
            return null;  // Return null or handle this scenario as needed
        }
        
        // Format the created_at and updated_at dates for readability
        employee.created_at = new Date(employee.created_at).toLocaleString('en-US', {timeZone: 'UTC'});
        employee.updated_at = new Date(employee.updated_at).toLocaleString('en-US', {timeZone: 'UTC'});
        
        // Optionally, format other dates such as last_login if needed
        employee.last_login = employee.last_login ? new Date(employee.last_login).toLocaleString('en-US', {timeZone: 'UTC'}) : null;
        
        return employee;
    } catch (error) {
        // Log the error with more detail
        logger.error(`Error in service fetching employee data for ID ${employeeId}:`, error);
        
        // Re-throw the error with a more meaningful message
        throw new Error(`Unable to fetch employee data for ID ${employeeId}. Please try again later.`);
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
        
        if (file.thumbnailPath) {
            const uniqueThumbnailFilename = generateUniqueFilename('thumbnail-' + file.originalname);
            thumbnailPath = await uploadEmployeeProfileImageToS3(file.thumbnailPath, uniqueThumbnailFilename);
        }
    } else {
        // Development: use local storage
        const sanitizedFilename = path.basename(file.sanitizedImagePath); // Get the basename to avoid path traversal issues
        const uploadsDir = path.resolve(__dirname, '../../server/uploads/profile');
        const imageFilePath = path.join(uploadsDir, sanitizedFilename); // Resolve against the base uploads directory
        
        // Ensure the path is within the uploads directory
        if (!imageFilePath.startsWith(uploadsDir)) {
            logger.error('Invalid file path detected:', imageFilePath);
            throw new Error('Invalid file path');
        }
        
        // Check if file exists
        try {
            await fs.access(imageFilePath); // Check if the file exists
        } catch (err) {
            logger.error('File not found:', imageFilePath);
            throw new Error('File not found');
        }
        
        // Get file stats safely
        const imageStats = await fs.stat(imageFilePath);
        imageSize = imageStats.size;
        
        // Construct the relative URL path for HTTP serving
        imagePath = `uploads/profile/${sanitizedFilename}`; // This path should match your static file route in Express
        
        // Similarly handle the thumbnail path
        if (file.thumbnailPath) {
            const sanitizedThumbnailFilename = path.basename(file.thumbnailPath);
            thumbnailPath = `uploads/profile/${sanitizedThumbnailFilename}`;
        }
    }
    
    const existingImage = await getEmployeeProfileImage(employeeId);
    
    if (existingImage.length > 0) {
        const {
            status,
            success,
            message
        } = await updateEmployeeProfileImage(employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash);
        return {status, success, message};
    } else {
        const {
            status,
            success,
            message
        } = await insertEmployeeProfileImage(employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash);
        return {status, success, message};
    }
};

module.exports = {
    createEmployeeHandler,
    getAllEmployeesService,
    getEmployeeProfileById,
    getEmployeeByFullName,
    uploadProfileImageService
};