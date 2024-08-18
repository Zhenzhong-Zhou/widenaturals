const { query } = require('../../database/database');

// Reusable query builder for audit logs
const buildAuditLogQuery = ({ tableName, employeeId, startDate, endDate }) => {
    let sql = `
        SELECT al.id, al.context, al.table_name, al.action, al.record_id,
               e.first_name || ' ' || e.last_name AS employee_name,
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
        sql += ' AND al.employee_id = $2';
        params.push(employeeId);
    }
    
    if (startDate && endDate) {
        sql += ' AND al.changed_at BETWEEN $3 AND $4';
        params.push(startDate, endDate);
    }
    
    sql += ' ORDER BY al.changed_at DESC';
    return { sql, params };
};

const getAuditLogs = async ({ tableName, employeeId, startDate, endDate, limit, offset }) => {
    const { sql, params } = buildAuditLogQuery({ tableName, employeeId, startDate, endDate });
    const paginatedSql = `${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    return await query(paginatedSql, [...params, limit, offset]);
};

module.exports = {
    getAuditLogs,
};