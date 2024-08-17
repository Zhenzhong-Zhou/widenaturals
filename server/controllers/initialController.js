const asyncHandler = require("../middlewares/asyncHandler");
const {getRoleDetails} = require("../services/roleService");
const {createUser} = require("../services/employeeService");
const logger = require("../utilities/logger");

// todo enhance => password => add log functions
const createAdmin = asyncHandler(async (req, res) => {
    const {first_name, last_name, email, password} = req.body;
    
    // Fetch the role ID for 'admin'
    const { id: roleId } = await getRoleDetails({ name: 'admin' });
    
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
    
    res.status(201).json({message: 'Admin created successfully'});
});

module.exports = {createAdmin};