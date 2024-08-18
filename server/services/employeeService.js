const { hash } = require('bcrypt');
const { query } = require('../database/database');
const { errorHandler } = require('../middlewares/errorHandler');
const validatePassword = require("../utilities/validator/validatePassword");
const {generateSalt} = require("../utilities/idUtils");
const {getRoleDetails} = require("./roleService");
const logger = require('../utilities/logger');
const {logAuditAction} = require("../utilities/log/auditLogger");

const getEmployeeDetails = async (employeeId) => {
    try {
        const result = await query(
            'SELECT first_name, last_name, email, role_id, status FROM employees WHERE id = $1',
            [employeeId]
        );
        
        if (result.length === 0) {
            throw new Error('Employee not found');
        }
        
        return result[0];
    } catch (error) {
        throw new Error(`Failed to fetch employee details: ${error.message}`);
    }
};

const createUser = async ({ first_name, last_name, email, phone_number, password, job_title, role_id, createdBy}) => {
    try {
        // Validate password strength and uniqueness
        await validatePassword(password, createdBy);
        
        // Generate a custom salt
        const customSalt = generateSalt();
        
        // Combine custom salt with bcrypt's built-in salting
        const hashedPassword = await hash(password + customSalt, 14);
        
        // Validate the role and creator exist
        const roleResult = await getRoleDetails({id: role_id});
        if (roleResult.length === 0) {
            throw errorHandler(400, "Invalid role ID", "The specified role does not exist.");
        }
        
        // Insert the new employee record into the database
        const employeeResult = await query(
            `INSERT INTO employees (first_name, last_name, email, phone_number, job_title, role_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [first_name, last_name, email, phone_number, job_title, role_id]
        );
        
        const employeeId = employeeResult[0].id;
        
        // Store the hashed password and salt in the employee_passwords table
        await query(
            `INSERT INTO employee_passwords (employee_id, password_hash, password_salt)
             VALUES ($1, $2, $3)`,
            [employeeId, hashedPassword, customSalt]
        );
        
        // Update the `created_by` field with the employee's own id or the creator's id
        await query(
            `UPDATE employees SET created_by = $1 WHERE id = $2`,
            [employeeId, employeeId]
        );
        
        // Log the employee creation action in the audit logs
        await logAuditAction(
            'employee_creation',
            'employees',
            'employee_created',
            employeeId,
            createdBy,
            null,
            { first_name, last_name, email, phone_number, job_title }
        );
        
        logger.info('New employee created successfully', {employee: employeeId, createdBy: employeeId});
        
        return employeeResult[0];
    } catch (error) {
        logger.error('Failed to create employee', {error: error.message, stack: error.stack});
        throw errorHandler(500, "Failed to create employee", error.message);
    }
};

module.exports = { getEmployeeDetails, createUser };