const {query} = require('../../database/database');
const logger = require("../../utilities/logger");

const buildLoginHistoryQuery = ({employeeId, startDate, endDate}) => {
    let sql = `
       SELECT lh.id, lh.employee_id, lh.login_at, lh.ip_address, lh.user_agent,
               CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
               e.email AS employee_email
        FROM login_history lh
        JOIN employees e ON lh.employee_id = e.id
        WHERE 1=1
    `;
    const params = [];
    
    if (employeeId) {
        sql += ` AND lh.employee_id = $${params.length + 1}`;
        params.push(employeeId);
    }
    
    if (startDate && endDate) {
        sql += ` AND lh.login_at BETWEEN $${params.length + 1} AND $${params.length + 2}`;
        params.push(startDate, endDate);
    }
    
    return {sql, params};
};

const countLoginHistory = async ({employeeId, startDate, endDate}) => {
    try {
        const {sql, params} = buildLoginHistoryQuery({employeeId, startDate, endDate});
        const countSql = `SELECT COUNT(*) AS total FROM (${sql}) AS subquery`;
        const result = await query(countSql, params);
        return result[0].total;
    } catch (error) {
        logger.error('Error counting login history records', {error: error.message});
        throw new Error('Failed to count login history records');
    }
};

const getLoginHistory = async ({employeeId, startDate, endDate, limit, offset}) => {
    try {
        const {sql, params} = buildLoginHistoryQuery({employeeId, startDate, endDate});
        const paginatedSql = `${sql} ORDER BY lh.login_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        return await query(paginatedSql, [...params, limit, offset]);
    } catch (error) {
        logger.error('Error fetching login history records', {error: error.message});
        throw new Error('Failed to fetch login history records');
    }
};

module.exports = {
    countLoginHistory,
    getLoginHistory,
};