const { query } = require('../../database/database');
const logger = require("../../utilities/logger");

// Reusable query builder for audit logs
const buildAuditLogQuery = ({ tableName, employeeId, startDate, endDate }) => {
    let sql = `
        SELECT al.id, al.context, al.table_name, al.action, al.record_id,
               CONCAT(e.first_name, ' ', e.last_name) AS employee_name AS employee_name,
               e.email AS employee_email, al.changed_at, al.old_data, al.new_data
        FROM audit_logs al
        LEFT JOIN employees e ON al.employee_id = e.id
        WHERE 1=1
    `;
    const params = [];
    
    if (tableName) {
        sql += ' AND al.table_name = $1';
        params.push(tableName);
    }
    
    if (employeeId) {
        sql += ` AND al.employee_id = $${params.length + 1}`;
        params.push(employeeId);
    }
    
    if (startDate && endDate) {
        sql += ` AND al.changed_at BETWEEN $${params.length + 1} AND $${params.length + 2}`;
        params.push(startDate, endDate);
    }
    
    return { sql, params };
};

const countAuditLogs = async ({ tableName, employeeId, startDate, endDate }) => {
    try {
        const { sql, params } = buildAuditLogQuery({ tableName, employeeId, startDate, endDate });
        const countSql = `SELECT COUNT(*) AS total FROM (${sql}) AS subquery`;
        const result = await query(countSql, params);
        return result[0].total;
    } catch (error) {
        logger.error('Error counting audit logs:', { error: error.message });
        throw new Error('Failed to count audit logs');
    }
};

const getAuditLogs = async ({ tableName, employeeId, startDate, endDate, limit, offset }) => {
    try {
        const { sql, params } = buildAuditLogQuery({ tableName, employeeId, startDate, endDate });
        const paginatedSql = `${sql} ORDER BY al.changed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        return await query(paginatedSql, [...params, limit, offset]);
    } catch (error) {
        logger.error('Error fetching audit logs:', { error: error.message });
        throw new Error('Failed to fetch audit logs');
    }
};

module.exports = {
    countAuditLogs,
    getAuditLogs,
};