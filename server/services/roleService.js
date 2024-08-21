const { query } = require('../database/database');
const logger = require('../utilities/logger');
const roleDAL = require("../dal/roles/roleDAL");

const getRoleDetails = async ({ name, id }) => {
    try {
        if (name) {
            // Fetch role ID by role name
            const result = await query('SELECT id FROM roles WHERE name = $1', [name]);
            if (result.length === 0) {
                throw new Error('Role not found');
            }
            return { id: result[0].id };
        } else if (id) {
            // Fetch role name and description by role ID
            const result = await query('SELECT name, description FROM roles WHERE id = $1', [id]);
            if (result.length === 0) {
                throw new Error('Role not found');
            }
            return { name: result[0].name, description: result[0].description };
        } else {
            throw new Error('Either name or id must be provided');
        }
    } catch (error) {
        throw new Error(`Failed to fetch role details: ${error.message}`);
    }
};

// Function to get or create a role by name
const getOrCreateRole = async (roleName, description = null) => {
    try {
        // Attempt to find the role by name
        let result = await getRoleDetails({name: roleName});
        
        if (result.length > 0) {
            // If the role exists, return its ID
            const existingRole = result[0];
            
            // If the description has changed, update it
            if (description && description !== existingRole.description) {
                await query(
                    'UPDATE roles SET description = $1 WHERE id = $2',
                    [description, existingRole.id]
                );
                logger.info(`Role ${roleName} updated with new description.`);
            }
            
            return existingRole.id;
        } else {
            // If the role does not exist, create it
            const insertResult = await query(
                'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id',
                [roleName, description]
            );
            logger.info(`Role ${roleName} created.`);
            return insertResult[0].id;
        }
    } catch (error) {
        logger.error('Error fetching or creating role', { roleName, error: error.message });
        throw new Error('Failed to get or create role.');
    }
};

const fetchRolesAvailableToHR = async () => {
    return await roleDAL.canHrAssignRole();
};

module.exports = {getRoleDetails, getOrCreateRole, fetchRolesAvailableToHR};