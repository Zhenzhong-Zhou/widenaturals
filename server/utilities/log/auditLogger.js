const {query} = require('../../database/database');
const logger = require('../logger');

const logAuditAction = async (context, tableName, action, recordId, employeeId, oldData = {}, newData = {}) => {
    try {
        await query(
            'INSERT INTO audit_logs (context, table_name, action, record_id, employee_id, old_data, new_data) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [context, tableName, action, recordId, employeeId, JSON.stringify(oldData), JSON.stringify(newData)]
        );
    } catch (error) {
        logger.error('Error logging audit action', {context, tableName, action, error: error.message});
    }
};

const logLoginHistory = async (employeeId, ipAddress, userAgent) => {
    try {
        await query('INSERT INTO login_history (employee_id, ip_address, user_agent) VALUES ($1, $2, $3)',
            [employeeId, ipAddress, userAgent]);
    } catch (error) {
        logger.error('Error logging login history', {employeeId, error: error.message});
    }
};

const logSessionAction = async (sessionId, employeeId, action, ipAddress, userAgent) => {
    try {
        await query('INSERT INTO session_logs (session_id, employee_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
            [sessionId, employeeId, action, ipAddress, userAgent]);
    } catch (error) {
        logger.error('Error logging session action', {sessionId, action, error: error.message});
    }
};

module.exports = {
    logAuditAction,
    logLoginHistory,
    logSessionAction
};