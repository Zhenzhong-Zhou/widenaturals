const {maskEmail, maskPhoneNumber, maskName, maskRoleId, maskTableName} = require("./helpers/maskHelper");

const maskSensitiveInfo = (value) => {
    if (typeof value !== 'string') return value;
    if (value.includes('@')) {
        return maskEmail(value);
    }
    if (value.length === 36 && value.includes('-')) {
        return maskRoleId(value); // Assuming this is a UUID
    }
    if (value.length > 16) {
        return value.slice(0, 4) + '*'.repeat(value.length - 8) + value.slice(-4);
    }
    return value.replace(/.(?=.{4})/g, '*');
};

// Utility to mask specific fields based on their type
const maskField = (fieldName, value) => {
    switch (fieldName) {
        case 'email':
            return maskEmail(value);
        case 'phone_number':
            return maskPhoneNumber(value);
        case 'first_name':
        case 'last_name':
            return maskName(value);
        case 'role_id':
            return maskRoleId(value);
        case 'table_name':
            return maskTableName(value);
        default:
            return maskSensitiveInfo(value);
    }
};

const maskNestedData = (nestedData) => {
    const maskedData = {};
    
    for (const key in nestedData) {
        if (nestedData.hasOwnProperty(key)) {
            maskedData[key] = maskField(key, nestedData[key]);
        }
    }
    
    return maskedData;
};

const maskDataArray = (dataArray) => {
    return dataArray.map(data => ({
        employee_id: maskField('employee_id', data.employee_id),
        employee_name: maskField('first_name', data.employee_name), // Assuming masking name logic
        employee_email: maskField('email', data.employee_email),
        role_name: maskField('role_name', data.role_name), // Assuming masking role name logic
        last_login_time: data.last_login_time, // Time fields might not need masking
        lockout_time: data.lockout_time,
        employee_status: data.employee_status,
        token_id: maskField('token_id', data.token_id),
        token: maskField('token', data.token),
        token_type: data.token_type,
        token_created_at: data.token_created_at,
        token_expires_at: data.token_expires_at,
        token_revoked: data.token_revoked,
        session_id: maskField('session_id', data.session_id),
        session_token: maskField('session_token', data.session_token),
        session_created_at: data.session_created_at,
        session_expires_at: data.session_expires_at,
        session_revoked: data.session_revoked,
        session_log_id: maskField('session_log_id', data.session_log_id),
        session_log_action: data.session_log_action,
        session_log_timestamp: data.session_log_timestamp,
        session_log_ip: maskField('ip_address', data.session_log_ip),
        session_log_user_agent: data.session_log_user_agent,
        login_history_id: maskField('login_history_id', data.login_history_id),
        login_time: data.login_time,
        login_ip: maskField('ip_address', data.login_ip),
        login_user_agent: data.login_user_agent,
        audit_log_id: maskField('audit_log_id', data.audit_log_id),
        audit_context: data.audit_context,
        audit_table: maskField('table_name', data.audit_table),
        audit_action: data.audit_action,
        audit_record_id: maskField('record_id', data.audit_record_id),
        audit_timestamp: data.audit_timestamp,
        audit_old_data: data.audit_old_data ? maskNestedData(data.audit_old_data) : null,
        audit_new_data: data.audit_new_data ? maskNestedData(data.audit_new_data) : null,
        permission_name: maskField('permission_name', data.permission_name),
        role_permission_granted_at: data.role_permission_granted_at,
        temporary_permission_expires_at: data.temporary_permission_expires_at
    }));
};

module.exports = { maskSensitiveInfo, maskField, maskDataArray };