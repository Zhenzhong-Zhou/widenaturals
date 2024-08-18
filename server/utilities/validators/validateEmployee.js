const { query } = require('../../database/database');
const logger = require('../../utilities/logger');

// Function to check if an admin exists, with optional runtime environment override
const checkAdminExists = async (roleName = 'admin', allowAdminCreationOverride = null) => {
    try {
        // Determine whether admin creation is allowed
        const allowToCreateAdmin = allowAdminCreationOverride !== null
            ? allowAdminCreationOverride
            : (process.env.ADMIN_CREATION === 'true');
        
        // Query to count active admins
        const queryText = `
            SELECT COUNT(*) as "adminCount"
            FROM employees e
            INNER JOIN roles r ON e.role_id = r.id
            WHERE r.name = $1
            AND e.status = 'active';
        `;
        
        const result = await query(queryText, [roleName]);
        
        if (result.length === 0) {
            throw new Error('Failed to retrieve admin existence check.');
        }
        
        const adminCount = parseInt(result[0].adminCount, 10);
        
        // Log the number of active admins
        logger.info(`Admin count for role '${roleName}': ${adminCount}`);
        
        // If admin creation is not allowed and an admin already exists, prevent creation
        if (!allowToCreateAdmin && adminCount > 0) {
            throw new Error('Admin creation blocked: Only one active admin is allowed.');
        }
        
        // Return true if any active admins exist, false otherwise
        return adminCount > 0;
    } catch (error) {
        logger.error('Error checking if admin exists', {
            context: 'admin_check',
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        throw new Error('Failed to check if admin exists.');
    }
};

const validateEmployeeData = async (data) => {
    let errors = [];
    
    // Example: Check if email already exists in the database
    const existingEmployee = await query('SELECT id FROM employees WHERE email = $1', [data.email]);
    if (existingEmployee.length > 0) {
        errors.push({ msg: 'Email is already registered', param: 'email' });
    }
    
    // Example: Custom logic for phone number or other fields
    if (!/^\(\d{3}\)-\d{3}-\d{4}$/.test(data.phone_number)) {
        errors.push({ msg: 'Phone number format is incorrect', param: 'phone_number' });
    }
    
    // Add more custom validations as needed
    
    return errors;
};

module.exports = {checkAdminExists};