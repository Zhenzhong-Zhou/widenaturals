const { query } = require('../../database/database');
const logger = require("../../utilities/logger");

// Reusable query builder for system monitoring
const buildSystemMonitorQuery = ({ tableName, employeeId, roleId, startDate, endDate, action, context, status, employeeRole, resourceType, ipAddress, userAgent, recordId, permission, method }) => {
    let sql = `
        SELECT
            e.id AS employee_id,
            CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
            e.email AS employee_email,
            r.name AS role_name,
            parent_r.name AS parent_role_name,
            e.last_login AS last_login_time,
            e.lockout_time AS lockout_time,
            e.status AS employee_status,
            
            -- Audit Log Details
            al.id AS audit_log_id,
            al.context AS audit_context,
            al.table_name AS audit_table,
            al.action AS audit_action,
            al.record_id AS audit_record_id,
            al.changed_at AS audit_timestamp,
            al.old_data AS audit_old_data,
            al.new_data AS audit_new_data
    `;
    
    const params = [];
    
    // Conditionally add token details
    if (employeeId || recordId || resourceType || action || method) {
        sql += `,
            -- Token Details
            t.id AS token_id,
            t.token,
            t.token_type,
            t.created_at AS token_created_at,
            t.expires_at AS token_expires_at,
            t.revoked AS token_revoked,
            
            -- Token Log Details
            tl.id AS token_log_id,
            tl.action AS token_log_action,
            tl.performed_at AS token_log_performed_at,
            tl.ip_address AS token_log_ip,
            tl.user_agent AS token_log_user_agent
        `;
    }
    
    // Conditionally add session details
    if (employeeId || recordId || status || ipAddress || userAgent) {
        sql += `,
            -- Session Details
            s.id AS session_id,
            s.token AS session_token,
            s.created_at AS session_created_at,
            s.expires_at AS session_expires_at,
            s.revoked AS session_revoked,
            
            -- Session Log Details
            sl.id AS session_log_id,
            sl.action AS session_log_action,
            sl.timestamp AS session_log_timestamp,
            sl.ip_address AS session_log_ip,
            sl.user_agent AS session_log_user_agent
        `;
    }
    
    // Conditionally add login history
    if (employeeId || ipAddress || userAgent) {
        sql += `,
            -- Login History
            lh.id AS login_history_id,
            lh.login_at AS login_time,
            lh.ip_address AS login_ip,
            lh.user_agent AS login_user_agent
        `;
    }
    
    // Conditionally add role and permission details
    if (permission || employeeRole) {
        sql += `,
            -- Role and Permission Details
            p.name AS permission_name,
            rp.created_at AS role_permission_granted_at,
            trp.expires_at AS temporary_permission_expires_at
        `;
    }
    
    sql += `
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.id
        LEFT JOIN roles parent_r ON r.parent_role_id = parent_r.id
        LEFT JOIN audit_logs al ON e.id = al.employee_id
    `;
    
    // Add token joins if needed
    if (employeeId || recordId || resourceType || action || method) {
        sql += `
        LEFT JOIN tokens t ON e.id = t.employee_id
        LEFT JOIN token_logs tl ON t.id = tl.token_id
        `;
    }
    
    // Add session joins if needed
    if (employeeId || recordId || status || ipAddress || userAgent) {
        sql += `
        LEFT JOIN sessions s ON e.id = s.employee_id
        LEFT JOIN session_logs sl ON s.id = sl.session_id
        `;
    }
    
    // Add login history join if needed
    if (employeeId || ipAddress || userAgent) {
        sql += `
        LEFT JOIN login_history lh ON e.id = lh.employee_id
        `;
    }
    
    // Add role and permission joins if needed
    if (permission || employeeRole) {
        sql += `
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        LEFT JOIN temporary_permissions trp ON e.id = trp.employee_id AND trp.permission_id = p.id
        `;
    }
    
    sql += ` WHERE 1=1 `; // Placeholder for easier concatenation of conditions
    
    if (tableName) {
        sql += ` AND al.table_name = $${params.length + 1}`;
        params.push(tableName);
    }
    
    if (context) {
        sql += ` AND al.context = $${params.length + 1}`;
        params.push(context);
    }
    
    if (employeeId) {
        sql += ` AND e.id = $${params.length + 1}`;
        params.push(employeeId);
    }
    
    if (roleId) {
        sql += ` AND e.role_id = $${params.length + 1}`;
        params.push(roleId);
    }
    
    if (action) {
        sql += ` AND al.action = $${params.length + 1}`;
        params.push(action);
    }
    
    if (status) {
        sql += ` AND e.status = $${params.length + 1}`;
        params.push(status);
    }
    
    if (resourceType) {
        sql += ` AND al.resource_type = $${params.length + 1}`;
        params.push(resourceType);
    }
    
    if (ipAddress) {
        sql += ` AND al.ip_address = $${params.length + 1}`;
        params.push(ipAddress);
    }
    
    if (userAgent) {
        sql += ` AND al.user_agent = $${params.length + 1}`;
        params.push(userAgent);
    }
    
    if (recordId) {
        sql += ` AND al.record_id = $${params.length + 1}`;
        params.push(recordId);
    }
    
    if (permission) {
        sql += ` AND p.name = $${params.length + 1}`;
        params.push(permission);
    }
    
    if (method) {
        sql += ` AND al.method = $${params.length + 1}`;
        params.push(method);
    }
    
    if (startDate && endDate) {
        sql += ` AND al.changed_at BETWEEN $${params.length + 1} AND $${params.length + 2}`;
        params.push(startDate, endDate);
    }
    
    return { sql, params };
};

const countSystemMonitor = async ({ tableName, employeeId, startDate, endDate, employeeRole, action, context, status, resourceType, ipAddress, userAgent, recordId, permission, method }) => {
    try {
        const { sql, params } = buildSystemMonitorQuery({ tableName, employeeId, startDate, endDate, employeeRole, action, context, status, resourceType, ipAddress, userAgent, recordId, permission, method });
        const countSql = `SELECT COUNT(*) AS total FROM (${sql}) AS subquery`;
        const result = await query(countSql, params);
        
        if (result && result.length > 0) {
            return result[0].total || 0;
        } else {
            logger.warn('Count query returned unexpected result structure', { tableName, employeeId, startDate, endDate });
            return 0;
        }
    } catch (error) {
        logger.error('Error counting system monitor logs:', { error: error.message });
        return 0;
    }
};

const getSystemMonitor = async ({ tableName, employeeId, roleId, startDate, endDate, action, context, status, resourceType, ipAddress, userAgent, recordId, permission, method, limit, offset, employeeRole }) => {
    try {
        const { sql, params } = buildSystemMonitorQuery({
            tableName,
            employeeId,
            roleId,
            startDate,
            endDate,
            action,
            context,
            status,
            resourceType,
            ipAddress,
            userAgent,
            recordId,
            permission,
            method,
            employeeRole
        });
        
        const paginatedSql = `${sql} ORDER BY al.changed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const result = await query(paginatedSql, [...params, limit, offset]);
        
        if (result && Array.isArray(result)) {
            return result;
        } else {
            logger.warn('Fetch query returned unexpected result structure', { tableName, employeeId, startDate, endDate });
            return [];
        }
    } catch (error) {
        logger.error('Error fetching system monitor logs:', { error: error.message });
        return [];
    }
};

module.exports = {
    countSystemMonitor,
    getSystemMonitor,
};