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
    
    // Check if the necessary actions are allowed
    let actionsAllowed = false;
    
    if (actionPermissions.canCreateEmployee && actionPermissions.canManageEmployees) {
        // General case: If the user can create and manage employees, allow the action
        actionsAllowed = true;
    }
    
    if (actionPermissions.canCreateManagers) {
        // Admin-specific case: If the user has admin access, allow them to create most roles
        actionsAllowed = true;
    }

    // If trying to create an admin role, require admin access
    if (employeeRole === 'admin' && !actionPermissions.canCreateManagers) {
        actionsAllowed = false;
        throw new Error("Assignment denied: Only users with admin access can assign the admin role.");
    }
    
    if (!actionsAllowed) {
        throw new Error("Assignment denied: You do not have the necessary permissions to perform this action.");
    }
    
    return roleAssignable && actionsAllowed;
};

module.exports = {
    getRolesAssignableByHr,
    canAssignRole,
};