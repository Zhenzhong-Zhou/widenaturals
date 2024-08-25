const { hash } = require('bcrypt');
const { query } = require('../database/database');
const { errorHandler, CustomError} = require('../middlewares/error/errorHandler');
const validatePassword = require("../utilities/validators/validatePassword");
const { generateSalt, getIDFromMap} = require("../utilities/idUtils");
const { getRoleDetails } = require("./roleService");
const logger = require('../utilities/logger');
const { logAuditAction } = require("../utilities/log/auditLogger");
const {canAssignRole} = require("../dal/roles/roleDAL");
const {fetchEmployeesWithImages, fetchEmployeeById, fetchEmployeeByFullName} = require("../dal/employees/employeeDAL");

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

module.exports = { createUser, createEmployeeHandler, getAllEmployeesService, getEmployeeById, getEmployeeByFullName };