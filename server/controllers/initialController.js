const asyncHandler = require("../middlewares/asyncHandler");
const db = require("../database/database");
const logger = require("../utilities/logger");
const {createUser} = require("../services/employeeService");
const {query} = require("../database/database");

const createAdmin = asyncHandler(async (req, res) => {
    const {first_name, last_name, email, password} = req.body;
    
    const roleRecord = await query(`
        SELECT id FROM roles WHERE name = $1;
    `, ['admin']);
    
    const admin = await createUser({
        first_name,
        last_name,
        email,
        phone_number: '(123)-456-7890',
        password,
        role_id: roleRecord[0].id,
        job_title: 'Root User',
        metadata: {
            department: 'IT',
            access_level: 'super_admin',
            created_at: new Date().toISOString(),
        }
    });
    
    res.status(201).json({message: 'Admin created successfully', data: admin});
});


module.exports = {createAdmin};