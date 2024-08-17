const asyncHandler = require("../middlewares/asyncHandler");
const {query, incrementOperations, decrementOperations} = require("../database/database")
const {getRoleDetails} = require("../services/roleService");
const {createUser} = require("../services/employeeService");
const logger = require("../utilities/logger");

// todo add log functions
const createAdmin = asyncHandler(async (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    
    try {
        // Start a transaction to ensure atomicity
        await query('BEGIN');
        incrementOperations();
        
        // Fetch the role ID for 'admin'
        const { id: roleId } = await getRoleDetails({ name: 'admin' });
        
        // Create the admin user in the employees table
        const admin = await createUser({
            first_name,
            last_name,
            email,
            phone_number: '(123)-456-7890',
            password,
            role_id: roleId,
            job_title: 'Root User',
            metadata: {
                department: 'IT',
                access_level: 'super_admin',
                created_at: new Date().toISOString(),
            }
        });
        
        const adminId = admin.id;
        
        // Log the admin creation event
        logger.info('Admin created successfully', { adminId: adminId, createdBy: adminId });
        
        // Commit the transaction
        await query('COMMIT');
        
        // Send the success response with admin details
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        // Rollback the transaction in case of any error
        await query('ROLLBACK');
        
        // Log the error and send an appropriate error response
        logger.error('Error creating admin', { error: error.message });
        res.status(500).json({ message: 'Failed to create admin', error: error.message });
    } finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
});

module.exports = {createAdmin};