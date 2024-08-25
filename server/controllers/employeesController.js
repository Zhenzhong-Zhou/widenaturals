const { promises: fs } = require('fs');
const asyncHandler = require("../middlewares/utils/asyncHandler");
const {query, incrementOperations, decrementOperations} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler, CustomError} = require("../middlewares/error/errorHandler");
const {getAllEmployeesService, uploadProfileImageService} = require("../services/employeeService");
const req = require("express/lib/request");

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

/**
 * Uploads or updates an employee's profile image.
 */
const uploadEmployeeProfileImage = asyncHandler(async (req, res) => {
    const employeeId = req.employee.originalEmployeeId;
    
    if (!req.file) {
        logger.error('No file uploaded');
        return errorHandler(400, 'No file uploaded');
    }
    
    try {
        // Start a transaction
        await query('BEGIN');
        incrementOperations();
        
        const result = await uploadProfileImageService(employeeId, req.file);
        
        res.status(result.status).json({
            message: result.message,
        });
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