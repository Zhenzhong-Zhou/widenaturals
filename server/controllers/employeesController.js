const asyncHandler = require("../middlewares/asyncHandler");
const {query} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");
const {getIDFromMap} = require("../utilities/idUtils");
const {logAuditAction} = require("../utilities/log/auditLogger");

const getAllEmployees = asyncHandler(async (req, res) => {
    try {
        const hashedEmployeeId = req.employee.sub;
        const { page, limit, offset } = getPagination(req);
        
        const originalEmployeeId = await getIDFromMap(hashedEmployeeId, 'employees');
        
        // Fetch employees with pagination, including their profile images if available
        const employees = await query(`
            SELECT
                CONCAT(e.first_name, ' ', e.last_name) AS full_name,
                e.email,
                e.phone_number,
                e.job_title,
                epi.image_path,
                epi.thumbnail_path
            FROM
                employees e
            LEFT JOIN
                employee_profile_images epi ON e.id = epi.employee_id
            WHERE
                e.status = 'active'
            ORDER BY
                e.created_at DESC
            LIMIT $1 OFFSET $2`, [limit, offset]
        );
        
        // Handle empty employees result silently
        if (!employees || employees.length === 0) {
            await logAuditAction(
                'employees_overview',
                'employees', 'select',
                originalEmployeeId, originalEmployeeId, {},
                { page, limit, offset, result: 'empty' }
            );
            return res.status(200).json({
                status: 'success',
                data: [],
                page,
                limit,
                totalItems: 0,
            });
        }
        
        // Log the successful query to the audit log
        await logAuditAction(
            'employees_overview',
            'employees',
            'select', originalEmployeeId,
            originalEmployeeId, {},
            { page, limit, offset, result: 'success' }
        );
        
        // Log the success info
        logger.info('Successfully fetched employees data', {
            context: 'employees_overview',
            employeeId: originalEmployeeId,
            resultCount: employees.length
        });
        
        // Respond with employees data including images if available
        res.status(200).json({
            status: 'success',
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: employees.length,
            },
            data: employees,
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


module.exports = {getAllEmployees, getEmployeeById, updateEmployee};