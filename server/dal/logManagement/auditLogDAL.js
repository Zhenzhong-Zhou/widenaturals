const { query } = require('../../database/database');

const getAllAuditLogs = async () => {
    const sql = `
        SELECT
            al.id,
            al.context,
            al.table_name,
            al.action,
            al.record_id,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.email AS employee_email,
            al.changed_at,
            al.old_data,
            al.new_data
        FROM
            audit_logs al
        LEFT JOIN
            employees e ON al.employee_id = e.id
        ORDER BY
            al.changed_at DESC;
    `;
    return await query(sql);
};

const getAuditLogsByTable = async (tableName) => {
    const sql = `
        SELECT
            al.id,
            al.context,
            al.table_name,
            al.action,
            al.record_id,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.email AS employee_email,
            al.changed_at,
            al.old_data,
            al.new_data
        FROM
            audit_logs al
        LEFT JOIN
            employees e ON al.employee_id = e.id
        WHERE
            al.table_name = $1
        ORDER BY
            al.changed_at DESC;
    `;
    return await query(sql, [tableName]);
};

const getAuditLogsByEmployee = async (employeeId) => {
    const sql = `
        SELECT
            al.id,
            al.context,
            al.table_name,
            al.action,
            al.record_id,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.email AS employee_email,
            al.changed_at,
            al.old_data,
            al.new_data
        FROM
            audit_logs al
        LEFT JOIN
            employees e ON al.employee_id = e.id
        WHERE
            al.employee_id = $1
        ORDER BY
            al.changed_at DESC;
    `;
    return await query(sql, [employeeId]);
};

const getAuditLogsByDateRange = async (startDate, endDate) => {
    const sql = `
        SELECT
            al.id,
            al.context,
            al.table_name,
            al.action,
            al.record_id,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.email AS employee_email,
            al.changed_at,
            al.old_data,
            al.new_data
        FROM
            audit_logs al
        LEFT JOIN
            employees e ON al.employee_id = e.id
        WHERE
            al.changed_at BETWEEN $1 AND $2
        ORDER BY
            al.changed_at DESC;
    `;
    return await query(sql, [startDate, endDate]);
};

module.exports = {
    getAllAuditLogs,
    getAuditLogsByTable,
    getAuditLogsByEmployee,
    getAuditLogsByDateRange,
};