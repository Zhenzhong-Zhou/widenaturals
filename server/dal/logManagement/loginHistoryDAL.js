const { query } = require('../../database/database');

const buildLoginHistoryQuery = ({ employeeId, startDate, endDate }) => {
    let sql = `
        SELECT id, employee_id, login_at, ip_address, user_agent
        FROM login_history
        WHERE 1=1
    `;
    const params = [];
    
    if (employeeId) {
        sql += ' AND employee_id = $1';
        params.push(employeeId);
    }
    
    if (startDate && endDate) {
        sql += ` AND login_at BETWEEN $${params.length + 1} AND $${params.length + 2}`;
        params.push(startDate, endDate);
    }
    
    return { sql, params };
};

const countLoginHistory = async ({ employeeId, startDate, endDate }) => {
    const { sql, params } = buildLoginHistoryQuery({ employeeId, startDate, endDate });
    const countSql = `SELECT COUNT(*) AS total FROM (${sql}) AS subquery`;
    const result = await query(countSql, params);
    return result[0].total;
};

const getLoginHistory = async ({ employeeId, startDate, endDate, limit, offset }) => {
    const { sql, params } = buildLoginHistoryQuery({ employeeId, startDate, endDate });
    const paginatedSql = `${sql} ORDER BY login_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    return await query(paginatedSql, [...params, limit, offset]);
};

module.exports = {
    countLoginHistory,
    getLoginHistory,
};