const {getRoleIdsByNames} = require("../../utilities/helpers/roleHelper");
const {query} = require('../../database/database');

const getRolesAssignableByHr = async () => {
    const sql = `
        SELECT name, description
        FROM roles
        WHERE name !~* '^(hr|admin|super.?admin|root)'
        AND name NOT IN ('ceo', 'hr_manager') AND is_active = TRUE
    `;
    
    const result = await query(sql);
    return result;
};

// Accept a single role name or a list of role names
const canHrAssignRole = async (roleNames) => {
    // Ensure roleNames is an array
    if (!Array.isArray(roleNames)) {
        roleNames = [roleNames];
    }
    
    // Get the corresponding role IDs
    const roleIds = await getRoleIdsByNames(roleNames);
    
    const sql = `
        SELECT COUNT(*)
        FROM roles
        WHERE id = ANY($1::uuid[])
        AND name !~* '^(hr|admin|super.?admin|root)'
        AND name NOT IN ('ceo', 'hr_manager')
        AND is_active = TRUE
    `;
   
    const result = await query(sql, [roleIds]);
    const dbCount = parseInt(result[0].count, 10); // Ensure it's a number
    
    // Ensure that all provided role IDs are valid and assignable
    return dbCount === roleIds.length;
};

module.exports = {
    getRolesAssignableByHr,
    canHrAssignRole,
};