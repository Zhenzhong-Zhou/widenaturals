const { hash } = require('bcrypt');
const { query } = require('../database/database');
const { errorHandler } = require('../middlewares/errorHandler');
const validatePassword = require("../utilities/validators/validatePassword");
const { generateSalt, getIDFromMap} = require("../utilities/idUtils");
const { getRoleDetails } = require("./roleService");
const logger = require('../utilities/logger');
const { logAuditAction } = require("../utilities/log/auditLogger");
const {canAssignRole} = require("../dal/roles/roleDAL");

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

const hashPassword = async (password) => {
    const customSalt = generateSalt();  // Generate the custom salt
    const hashedPassword = await hash(password + customSalt, 14);  // Combine with bcrypt's salting
    return { hashedPassword, customSalt };  // Return both the hashed password and the custom salt
};

const createUser = async ({ firstName, lastName, email, phoneNumber, password, jobTitle, roleId, createdBy }) => {
    try {
        // Validate password strength and uniqueness
        await validatePassword(password, createdBy);
        
        const { hashedPassword, customSalt } = await hashPassword(password);
        
        // Insert the new employee record into the database
        const employeeResult = await query(
            `INSERT INTO employees (first_name, last_name, email, phone_number, job_title, role_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [firstName, lastName, email, phoneNumber, jobTitle, roleId]
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
            [createdBy, employeeId]
        );
        
        // Log the employee creation action in the audit logs
        await logAuditAction(
            'employee_creation',
            'employees',
            'employee_created',
            employeeId,
            createdBy,
            null,
            { firstName, lastName, email, phoneNumber, jobTitle }
        );
        
        logger.info('New employee created successfully', { employee: employeeId, createdBy });
        
        return employeeResult[0];
    } catch (error) {
        logger.error('Failed to create employee', { error: error.message, stack: error.stack });
        throw errorHandler(500, "Failed to create employee", error.message);
    }
};

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
    return await createUser({
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

module.exports = { getEmployeeDetails, createUser, createEmployeeHandler };