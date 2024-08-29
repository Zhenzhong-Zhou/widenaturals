const {query} = require("../../database/database");
const logger = require("../../utilities/logger");

const fetchEmployeePermissionsById = async (employeeId) => {
    const sql = `
        SELECT
            ARRAY_AGG(DISTINCT p.name) AS role_permissions,
            ARRAY_AGG(DISTINCT p2.name) AS temporary_permissions
        FROM
            employees e
        LEFT JOIN
            roles r ON e.role_id = r.id
        LEFT JOIN
            role_permissions rp ON r.id = rp.role_id
        LEFT JOIN
            permissions p ON rp.permission_id = p.id
        LEFT JOIN
            temporary_permissions tp ON e.id = tp.employee_id
            AND tp.expires_at > NOW()
            AND tp.status = 'active'
        LEFT JOIN
            permissions p2 ON tp.permission_id = p2.id
        WHERE
            e.id = $1
            AND e.status = 'active'
        GROUP BY
            e.id;
    `;
    
    const values = [employeeId];
    
    try {
        const result = await query(sql, values);
        return result[0];
    } catch (error) {
        logger.error('Error fetching employee permissions:', error);
        throw new Error('Error fetching employee permissions');
    }
};

module.exports = {
    fetchEmployeePermissionsById,
};