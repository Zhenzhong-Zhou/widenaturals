const { query } = require('../database/database');

// Function to log actions to audit_logs table
const logAuditAction = async (tableName, action, recordId, employeeId, oldData = null, newData = null) => {
    try {
        await query(
            'INSERT INTO audit_logs (table_name, action, record_id, employee_id, changed_at, old_data, new_data) VALUES ($1, $2, $3, $4, NOW(), $5, $6)',
            [tableName, action, recordId, employeeId, oldData, newData]
        );
    } catch (error) {
        console.error('Error logging audit action:', error);
    }
};

// Function to log login history
const logLoginHistory = async (employeeId, ipAddress, userAgent) => {
    try {
        await query(
            'INSERT INTO login_history (employee_id, login_at, ip_address, user_agent) VALUES ($1, NOW(), $2, $3)',
            [employeeId, ipAddress, userAgent]
        );
    } catch (error) {
        console.error('Error logging login history:', error);
    }
};

module.exports = {
    logAuditAction,
    logLoginHistory,
};