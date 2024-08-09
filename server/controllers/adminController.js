const asyncHandler = require("../middlewares/asyncHandler");
const {hash} = require("bcrypt");
const { query } = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");
const {createUser} = require("../services/employeeService");

const createManager = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, email, password, jobTitle, role } = req.body;
    
    // Assuming `req.user` contains the authenticated user's data
    // const createdBy = req.user.id;  // Extract the user ID of the person creating the manager
    console.log("req.body: ", req.body);
    try {
        const manager = await createUser({
            firstName,
            lastName,
            email,
            password,
            jobTitle,
            role,
            createdBy: null,
        });
        console.log(manager);
        // const employee = await query(
        //     `INSERT INTO employees (first_name, last_name, email, password, job_title)
        //      VALUES ($1, $2, $3, $4, $5)
        //      RETURNING *`,
        //     [firstName, lastName, email, password, jobTitle]
        // );
        // console.log("employee: ", employee);
        res.status(201).json({ message: 'Manager created successfully', data: manager });
        // res.status(201).json({ message: 'Manager created successfully', data: employee });
    } catch (error) {
        next(errorHandler(500, "Failed to create manager", error.message));
    }
});

const createEmployee = asyncHandler(async (req, res, next) => {
    const { firstName, lastName, email, password, jobTitle } = req.body;
    
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
        
        res.status(201).json({ message: 'Employee created successfully', data: employee });
    } catch (error) {
        next(error);
    }
});

module.exports = { createManager, createEmployee };