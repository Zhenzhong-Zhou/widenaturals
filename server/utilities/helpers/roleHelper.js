const { query } = require('../../database/database');

// Helper function to get role IDs by a list of role names
const getRoleIdsByNames = async (roleNames) => {
    // Ensure roleNames is an array, even if a single string is provided
    if (!Array.isArray(roleNames)) {
        roleNames = [roleNames];
    }
    
    const sql = `SELECT id FROM roles WHERE name = ANY($1)`;
    const result = await query(sql, [roleNames]);
    
    if (result.length === 0) {
        throw new Error(`Role name(s) "${roleNames.join(', ')}" not found`);
    }
    
    // Return an array of IDs
    return result.map(row => row.id);
};

module.exports = {getRoleIdsByNames}