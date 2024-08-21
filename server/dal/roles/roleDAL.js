const {query} = require('../../database/database');

const getRolesAssignableByHr = async () => {
    const sql = `
        SELECT name, description
        FROM roles
        WHERE name !~* '^(hr|admin|super.?admin|root)'
        AND name NOT IN ('ceo', 'hr_manager')
        AND is_active = TRUE
    `;

    return await query(sql);
};

const canAssignRole = async (roleIds, employeeRole, permissions) => {
    // Ensure roleIds is an array
    if (!Array.isArray(roleIds)) {
        roleIds = [roleIds];
    }
    
    let sql;
    
    // Role-based validation logic
    if (employeeRole === 'hr_manager') {
        sql = `
            SELECT COUNT(*)
            FROM roles
            WHERE id = ANY($1::uuid[])
            AND name !~* '^(hr|admin|super.?admin|root)'
            AND name NOT IN ('ceo', 'hr_manager')
            AND is_active = TRUE
        `;
    } else if (employeeRole === 'admin') {
        sql = `
            SELECT COUNT(*)
            FROM roles
            WHERE id = ANY($1::uuid[])
            AND name !~* '^(admin|super.?admin|root)'
            AND is_active = TRUE
        `;
    } else {
        throw new Error("Invalid role for assigning roles.");
    }
    
    const result = await query(sql, [roleIds]);
    const dbCount = parseInt(result[0].count, 10);
    
    // Ensure that all provided role IDs are valid and assignable
    const roleAssignable = dbCount === roleIds.length;
    
    // Granular action-based permission check
    const actionPermissions = {
        canCreateManagers: permissions.includes('admin_access'),
        canCreateEmployee: permissions.includes('create_employee'),
        canManageEmployees: permissions.includes('manage_employees'),
    };
    
    // Hybrid Check: Role and Action-Based
    if (employeeRole === 'admin') {
        // Admins should be able to create most roles as long as they have admin access
        if (!roleAssignable) {
            throw new Error("Assignment denied: Admins cannot assign the restricted roles.");
        }
    } else if (employeeRole === 'hr_manager') {
        // HR Managers can create and manage employees but with restrictions
        if (!actionPermissions.canCreateEmployee || !actionPermissions.canManageEmployees) {
            throw new Error("Assignment denied: You do not have the necessary permissions to assign this role.");
        }
    } else {
        // For any other roles, ensure both roleAssignable and actionPermissions are met
        if (!roleAssignable || !actionPermissions.canCreateEmployee) {
            throw new Error("Assignment denied: Insufficient permissions to assign this role.");
        }
    }
    
    return roleAssignable;
};

module.exports = {
    getRolesAssignableByHr,
    canAssignRole,
};