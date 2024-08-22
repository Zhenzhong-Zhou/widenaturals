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

module.exports = {
    fetchEmployeesWithImages
};