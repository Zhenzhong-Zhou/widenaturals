const {query} = require('../../database/database');
const logger = require('../logger');

const logAuditAction = async (context, tableName, action, recordId, employeeId = null, oldData = {}, newData = {}) => {
    try {
        if (!recordId) {
            throw new Error('Record ID is required for audit logging');
        }
        
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

const logTokenAction = async (employeeId, tokenId, tokenType, action, ipAddress, userAgent, details = {}) => {
    try {
        await query(
            'INSERT INTO token_logs (employee_id, token_id, token_type, action, ip_address, user_agent, details) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [employeeId, tokenId, tokenType, action, ipAddress, userAgent, JSON.stringify(details)]
        );
    } catch (error) {
        logger.error('Error logging token action', {employeeId, tokenId, tokenType, action, error: error.message});
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
    logTokenAction,
    logSessionAction
};