const asyncHandler = require("../middlewares/utlis/asyncHandler");
const {query, incrementOperations, decrementOperations} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/error/errorHandler");
const {createEmployeeHandler} = require("../services/employeeService");
const {getIDFromMap} = require("../utilities/idUtils");
const {getRoleDetails} = require("../services/roleService");
const {logAuditAction} = require("../utilities/log/auditLogger");
const {createLoginDetails} = require("../utilities/log/logDetails");

const createEmployeeHR = asyncHandler(async (req, res, next) => {
    try {
        // Start a transaction to ensure atomicity
        await query('BEGIN');
        incrementOperations();
        logger.info('Transaction started for employee creation by HR');
        
        const hashedEmployeeId = req.employee.sub;
        const hashedRoleId = req.employee.role;
        const permissions = req.permissions;
        
        const { first_name: firstName, last_name: lastName, email, phone_number: phoneNumber, password, job_title: jobTitle, role_name: roleName } = req.body;
        
        // Get the original employee ID from the hashed value
        const employeeId = await getIDFromMap(hashedEmployeeId, 'employees');
        
        // Get role details from the provided role name
        const { id: roleId } = await getRoleDetails({ name: roleName });
        
        // Log the start of the employee creation process
        logger.info('Creating a new employee', { createdBy: employeeId, roleName });
        
        // Audit log: Start employee creation
        await logAuditAction('hr', 'employees', 'create_start', '00000000-0000-0000-0000-000000000000', employeeId, {}, {
            firstName,
            lastName,
            email,
            phoneNumber,
            jobTitle,
            roleName
        });
        
        // Create the employee
        const employee = await createEmployeeHandler({
            createdBy: employeeId,
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            jobTitle,
            roleId,
            hashedRoleId,
            permissions
        });
        
        // Log the successful creation of the employee
        logger.info('Employee created successfully by HR', { employeeId: employee.id, createdBy: employeeId });
        
        const loginDetails = createLoginDetails(req.get('User-Agent'), 'hr_manager_action', req.location || 'Unknown', 'create_employee', {
            firstName,
            lastName,
            email,
            phoneNumber,
            jobTitle,
            roleName,
            createdBy: employeeId
        });
        
        // Audit log: Successful employee creation
        await logAuditAction('hr', 'employees', 'create_success', employee.id, employeeId, {}, loginDetails);
        
        await query('COMMIT');
        logger.info('Transaction committed successfully for employee creation by HR');
        
        res.status(201).json({ message: 'Employee created successfully', data: employee });
    } catch (error) {
        await query('ROLLBACK');
        logger.error('Error in createEmployeeHR', { error: error.message, stack: error.stack });
        
        errorHandler(500, 'Internal server error.');
    } finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
});

const getEmployeeById = async (req, res, next) => {
    try {
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

const deleteEmployee = async (req, res, next) => {
    try {
        res.status(200).send("")
    } catch (error) {
        next(errorHandler(500, "Internal Server Error"));
    }
};

module.exports = {createEmployeeHR, getEmployeeById, updateEmployee, deleteEmployee};