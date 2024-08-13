const asyncHandler = require("../middlewares/asyncHandler");
const {hash} = require("bcrypt");
const {query} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");
const {createUser} = require("../services/employeeService");

const toggleAdminCreation = asyncHandler(async (req, res, next) => {
    const secret = req.headers['x-secret-key'];
    if (secret !== process.env.ADMIN_CREATION_SECRET) {
        return res.status(403).send('Forbidden: Invalid secret key.');
    }
    
    const {enable} = req.body;
    
    if (typeof enable !== 'boolean') {
        return res.status(400).send('Invalid request: "enable" must be a boolean.');
    }
    
    const newStatus = enable ? 'true' : 'false';
    
    console.log(newStatus)
    
    process.env.ALLOW_ADMIN_CREATION = newStatus;
    
    // Optionally update the .env file if you want persistence
    // updateEnv('ALLOW_ADMIN_CREATION', newStatus);
    
    res.status(200).send(`Admin creation ${enable ? 'enabled' : 'disabled'}.`);
});

const createManager = asyncHandler(async (req, res, next) => {
    const createdBy = req.employee;
    const {firstName, lastName, email, phoneNumber, password, role, jobTitle} = req.body;
    
    console.log("createdBy: ", createdBy);
    
    // Look up the role_id from the roles table based on the role name provided
    const roleRecord = await query(`
        SELECT id FROM roles WHERE name = $1;
    `, [role]);
    
    if (roleRecord.length === 0) {
        return res.status(400).json({message: 'Invalid role provided'});
    }
    
    try {
        const manager = await createUser({
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            jobTitle,
            role_id: roleRecord[0].id,
            createdBy: null,
        });
        
        res.status(201).json({message: 'Manager created successfully', data: manager});
        // res.status(201).json({ message: 'Manager created successfully', data: employee });
    } catch (error) {
        next(errorHandler(500, "Failed to create manager", error.message));
    }
});

const createEmployee = asyncHandler(async (req, res, next) => {
    const {firstName, lastName, email, password, jobTitle} = req.body;
    
    // const createdBy = req.user.id; // Ensure req.user is populated by your auth middleware
    
    try {
        const employee = await createUser({
            firstName,
            lastName,
            email,
            password,
            jobTitle: jobTitle || 'Employee',  // Default to 'Employee' if no job title is provided
            role: 'employee', // Set role as employee
            createdBy
        });
        
        res.status(201).json({message: 'Employee created successfully', data: employee});
    } catch (error) {
        next(error);
    }
});

module.exports = {toggleAdminCreation, createManager, createEmployee};