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

const fetchEmployeeById = async (employeeId) => {
    const sql = `
        SELECT
            CONCAT(e.first_name, ' ', e.last_name) AS full_name,
            e.email,
            e.phone_number,
            e.job_title,
            r.name AS role_name,
            e.created_at,
            e.updated_at,
            e.last_login,
            e.status,
            e.two_factor_enabled,
            e.metadata,
            epi.image_path,
            epi.thumbnail_path,
            epi.alt_text,
            ARRAY_AGG(DISTINCT p.name) AS role_permissions,
            ARRAY_AGG(DISTINCT p2.name) AS temporary_permissions
        FROM
            employees e
        LEFT JOIN
            employee_profile_images epi ON e.id = epi.employee_id
        LEFT JOIN
            roles r ON e.role_id = r.id
        LEFT JOIN
            role_permissions rp ON r.id = rp.role_id
        LEFT JOIN
            permissions p ON rp.permission_id = p.id
        LEFT JOIN
            temporary_permissions tp ON e.id = tp.employee_id AND tp.expires_at > NOW() AND tp.status = 'active'
        LEFT JOIN
            permissions p2 ON tp.permission_id = p2.id
        WHERE
            e.id = $1
            AND e.deleted_at IS NULL
        GROUP BY
            e.id,
            r.name,
            epi.image_path,
            epi.thumbnail_path,
            epi.alt_text;
    `;
    
    const values = [employeeId];
    
    try {
        const result = await query(sql, values);
        return result[0];
    } catch (error) {
        console.error('Error fetching employee data:', error);
        throw new Error('Error fetching employee data');
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
    await query(
        `
        INSERT INTO employee_profile_images (employee_id, image_path, image_type, image_size, thumbnail_path, image_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash]
    );
};

const updateEmployeeProfileImage = async (employeeId, imagePath, imageType, imageSize, thumbnailPath, imageHash) => {
    await query(
        `
        UPDATE employee_profile_images
        SET image_path = $1, image_type = $2, image_size = $3, thumbnail_path = $4, image_hash = $5, updated_at = NOW()
        WHERE employee_id = $6
        `,
        [imagePath, imageType, imageSize, thumbnailPath, imageHash, employeeId]
    );
};

module.exports = {
    insertEmployee,
    fetchEmployeesWithImages,
    fetchEmployeeById,
    fetchEmployeeByFullName,
    getEmployeeProfileImage,
    insertEmployeeProfileImage,
    updateEmployeeProfileImage
};