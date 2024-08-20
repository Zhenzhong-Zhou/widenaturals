const asyncHandler = require("../middlewares/asyncHandler");
const {query} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");

const getAllEmployees = asyncHandler(async (req, res, next) => {
    const {employee} = req
    const {page, limit, offset} = getPagination(req);
    
    try {
        // Fetch employees with pagination
        const employees = await query(
            'SELECT * FROM employees ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        
        // Handle empty employees result silently
        if (!employees || employees.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: [],
                pagination: {
                    currentPage: page,
                    itemsPerPage: limit,
                    totalItems: 0,
                }
            });
        }
        
        // // Log the query to the audit_log table (critical failure if it fails)
        // await query(
        //     'INSERT INTO audit_log (action, table_name, employee_id, query) VALUES ($1, $2, $3, $4)',
        //     ['SELECT', 'employees', req.employee.id, JSON.stringify({ page, limit })]
        // );
        
        // Respond with employees data
        res.status(200).json({
            status: 'success',
            data: employees,
            pagination: {
                currentPage: page,
                itemsPerPage: limit,
                totalItems: employees.length,
            }
        });
    } catch (error) {
        // Handle critical errors such as missing audit_log table
        logger.error('Critical failure in getAllEmployees', {
            context: 'getAllEmployees',
            error: error.message,
            stack: error.stack,
            userId: req.user ? req.user.id : 'Unknown'
        });
        next(errorHandler(500, 'Internal Server Error', error.message));
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