const {promises: fs} = require('fs');
const asyncHandler = require("../middlewares/utils/asyncHandler");
const {query, incrementOperations, decrementOperations} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/error/errorHandler");
const {
    getAllEmployeesService,
    uploadProfileImageService,
    getEmployeeProfileById
} = require("../services/employeeService");

const getAllEmployees = asyncHandler(async (req, res) => {
    try {
        const originalEmployeeId = req.employee;
        const {page, limit, offset} = getPagination(req);
        
        // Call the service layer to handle the request
        const {employees, totalCount} = await getAllEmployeesService(originalEmployeeId, page, limit, offset);
        
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

const fetchEmployeeProfileById = async (req, res, next) => {
    try {
        const originalEmployeeId = req.employee;
        
        // Fetch employee profile data
        const profileData = await getEmployeeProfileById(originalEmployeeId);
        
        // Check if profile data is found
        if (!profileData) {
            return next(errorHandler(404, `Employee with ID ${originalEmployeeId} not found`));
        }
        
        // Respond with the profile data
        res.status(200).json({
            message: `Successfully retrieved employee profile for ID: ${originalEmployeeId}`,
            data: profileData
        });
    } catch (error) {
        // Log error details
        logger.error(`Error fetching employee profile for ID ${req.employee}:`, error);
        
        // Use a generic error handler for internal server errors
        errorHandler(500, "Internal Server Error");
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
    const employeeId = req.employee;
    
    if (!req.file) {
        logger.error('No file uploaded');
        return errorHandler(400, 'No file uploaded');
    }
    
    try {
        // Start a transaction
        await query('BEGIN');
        incrementOperations();
        
        const result = await uploadProfileImageService(employeeId, req.file);
        
        await query('COMMIT');
        
        res.status(result.status).json({
            success: result.success,
            message: result.message,
        });
    } catch (error) {
        await query('ROLLBACK');
        logger.error('Failed to upload or update profile image', {error: error.message});
        errorHandler(500, 'Internal Server Error', error.message);
    } finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
});

module.exports = {getAllEmployees, fetchEmployeeProfileById, updateEmployee, uploadEmployeeProfileImage};