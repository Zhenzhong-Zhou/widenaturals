const { query } = require('../../database/database');
const hashPassword = require("../../utilities/passwordUtils");
const validatePassword = require("../../utilities/validators/validatePassword");
const {logAuditAction} = require("../../utilities/log/auditLogger");
const logger = require("../../utilities/logger");
const {errorHandler} = require("../../middlewares/error/errorHandler");

const insertEmployee = async ({ firstName, lastName, email, phoneNumber, password, jobTitle, roleId, createdBy }) => {
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

const fetchEmployeesWithImages = async (limit, offset) => {
    // Fetch employees and their images with pagination
    const employees = await query(`
        SELECT
            CONCAT(e.first_name, ' ', e.last_name) AS full_name,
            e.email,
            e.phone_number,
            e.job_title,
            epi.image_path,
            epi.thumbnail_path,
            COUNT(*) OVER() AS total_count  -- Fetch total count of records
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
    
    // Extract total count from the first row if available
    const totalCount = employees.length > 0 ? employees[0].total_count : 0;
    
    return {
        employees,
        totalCount
    };
};

const fetchEmployeeProfileById = async (employeeId) => {
    const sql = `
        SELECT
            CONCAT(e.first_name, ' ', e.last_name) AS full_name,
            e.email,
            e.phone_number,
            e.job_title,
            r.name AS role_name,
            TO_CHAR(e.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
            TO_CHAR(e.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at,
            TO_CHAR(e.last_login, 'YYYY-MM-DD HH24:MI:SS') AS last_login,
            e.status,
            e.two_factor_enabled,
            e.metadata,
            epi.image_path,
            epi.thumbnail_path,
            epi.alt_text
        FROM
            employees e
        LEFT JOIN
            employee_profile_images epi ON e.id = epi.employee_id
        LEFT JOIN
            roles r ON e.role_id = r.id
        WHERE
            e.id = $1
            AND e.status = 'active';
    `;
    
    const values = [employeeId];
    
    try {
        // Input validation
        if (!employeeId) {
            throw new Error('Invalid employee ID');
        }
        
        const result = await query(sql, values);
        
        // Check if the employee exists
        if (result.length === 0) {
            logger.warn(`No active employee found with ID: ${employeeId}`);
            return null;
        }
        
        return result[0];
    } catch (error) {
        // Log error with additional context
        logger.error(`Error fetching employee profile data for ID ${employeeId}:`, error);
        
        // Re-throw the error with a more specific message
        throw new Error(`Unable to fetch employee profile data for ID ${employeeId}`);
    }
};

const fetchEmployeeByFullName = async (employeeName) => {
    try {
        const sql = `
        SELECT e.id
        FROM employees e
        WHERE CONCAT(e.first_name, ' ', e.last_name) = $1
    `;
        
        // Execute the query with the provided employee name
        const result = await query(sql, [employeeName]);
        
        // Return the fetched employee data
        return result[0];
    } catch (err) {
        console.error('Error fetching employee by full name:', err);
        throw err;
    }
};

const getEmployeeProfileImage = async (employeeId) => {
    return await query('SELECT id FROM employee_profile_images WHERE employee_id = $1', [employeeId]);
};

const insertEmployeeProfileImage = async (employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash) => {
    try {
        const result = await query(
            `
            INSERT INTO employee_profile_images (employee_id, image_path, image_type, image_size, thumbnail_path, image_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            `,
            [employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash]
        );
        
        if (result.length === 0) {
            throw new Error('Failed to insert employee profile image');
        }
        
        return {status: 201, success: true, message: 'Profile image uploaded successfully',};
    } catch (error) {
        // Log the error or handle it as needed
        logger.error('Error inserting employee profile image:', error);
        throw new Error('Error inserting employee profile image');
    }
};

const updateEmployeeProfileImage = async (employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash) => {
    try {
        const result = await query(
            `
                UPDATE employee_profile_images
                SET image_path = $1, image_type = $2, image_size = $3, thumbnail_path = $4, image_hash = $5, updated_at = NOW()
                WHERE employee_id = $6 RETURNING employee_id
            `,
            [imagePath, imageType, imageSize, thumbnailPath, imageHash, employeeId]
        );
        
        // Check if the update was successful
        if (result.length === 0) {
            throw new Error(`No employee found with ID: ${result[0].employee_id}`);
        }
        
        // Return success status
        return { status: 200, success: true, message: 'Profile image updated successfully' };
    } catch (error) {
        // Log the error and return failure status
        logger.error('Error updating employee profile image:', error);
        return { success: false, message: error.message };
    }
};

module.exports = {
    insertEmployee,
    fetchEmployeesWithImages,
    fetchEmployeeProfileById,
    fetchEmployeeByFullName,
    getEmployeeProfileImage,
    insertEmployeeProfileImage,
    updateEmployeeProfileImage
};