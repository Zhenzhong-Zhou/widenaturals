const { query } = require('../../database/database');

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
}

module.exports = {
    fetchEmployeesWithImages,
    fetchEmployeeById,
    fetchEmployeeByFullName
};