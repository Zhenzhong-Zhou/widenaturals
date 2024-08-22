const asyncHandler = require("../middlewares/utlis/asyncHandler");
const {query, incrementOperations, decrementOperations} = require("../database/database")
const {createEmployeeHandler} = require("../services/employeeService");
const {createLoginDetails} = require("../utilities/log/logDetails");
const {logAuditAction} = require("../utilities/log/auditLogger");
const logger = require("../utilities/logger");

const createAdmin = asyncHandler(async (req, res) => {
    const { first_name, last_name, email, phone_number, job_title, role_id, password } = req.body;
    
    try {
        // Start a transaction to ensure atomicity
        await query('BEGIN');
        incrementOperations();
        
        // Create the admin user using the createEmployeeHandler function
        const admin = await createEmployeeHandler({
            creatorId: null,  // Admin creation might be system-initiated, so creatorId can be null or system ID
            firstName: first_name,
            lastName: last_name,
            email,
            phoneNumber: phone_number,
            password,
            jobTitle: job_title,
            roleId: role_id,
            metadata: {
                department: 'IT',
                access_level: 'super_admin',
                created_at: new Date().toISOString(),
            },
            isInitialAdmin: true
        });
        
        const adminId = admin.id;
        
        // Update the created_by field with the admin's own ID
        await query('UPDATE employees SET created_by = $1 WHERE id = $2', [adminId, adminId]);
        
        // Use createLoginDetails to log detailed info
        const loginDetails = createLoginDetails(req.get('User-Agent'), 'admin_creation', 'Internal', 'create');
        
        // Log the admin creation event
        await logAuditAction('admin_creation', 'employees', 'created_admin', adminId, adminId, null, loginDetails);
        
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