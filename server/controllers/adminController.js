const asyncHandler = require("../middlewares/asyncHandler");
const {query, incrementOperations, decrementOperations} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");
const {createEmployeeHandler} = require("../services/employeeService");
const {getIDFromMap} = require("../utilities/idUtils");
const {getRoleDetails} = require("../services/roleService");
const {logAuditAction} = require("../utilities/log/auditLogger");

const createEmployeeAdmin = asyncHandler(async (req, res, next) => {
    try {
        // Start a transaction to ensure atomicity
        await query('BEGIN');
        incrementOperations();
        
        const hashedEmployeeId = req.employee.sub;
        const hashedRoleId = req.employee.role;
        const permissions = req.permissions;
        const { first_name: firstName, last_name: lastName, email, phone_number: phoneNumber, password, job_title: jobTitle, role_name: roleName } = req.body;
        
        // Get the original employee ID from the hashed value
        const employeeId = await getIDFromMap(hashedEmployeeId, 'employees');
        
        // Get role details from the provided role name
        const {id} = await getRoleDetails({name: roleName});
        
        // Log the start of the employee creation process
        logger.info('Creating a new employee', { createdBy: employeeId, roleName });
        
        // Create the employee
        const employee = await createEmployeeHandler({
            createdBy: employeeId,
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            jobTitle,
            roleId: id,
            hashedRoleId,
            permissions
        });
        
        // Log the successful creation of the employee
        logger.info('Employee created successfully', { employeeId: employee.id, createdBy: employeeId });
        
        await query('COMMIT');
        
        res.status(201).json({ message: 'Employee created successfully', data: employee });
    } catch (error) {
        await query('ROLLBACK');
        logger.error('Error in createEmployeeAdmin', { error: error.message, stack: error.stack });
        next(error);
    }
    finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
});

module.exports = {createEmployeeAdmin};