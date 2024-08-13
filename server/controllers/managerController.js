const asyncHandler = require("../middlewares/asyncHandler");
const {query} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");
const {createUser} = require("../services/employeeService");

const createEmployee = asyncHandler(async (req, res, next) => {
    const {firstName, lastName, email, phoneNumber, password, jobTitle} = req.body;
    
    const employeePayload = req.employee; // Ensure req.user is populated by your auth middleware
    const hashedId = req.employee.sub;
    const employeeId = await query(`
        SELECT original_id FROM id_hash_map WHERE hashed_id = $1;
    `, [hashedId]);
    const createdBy = employeeId[0].original_id;
    console.log("manager route createdBy", createdBy);
    try {
        const employee = await createUser({
            firstName,
            lastName,
            email,
            phoneNumber,
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

const getEmployeeById = async (req, res, next) => {
    try {
        res.status(200).send("")
    } catch (error) {
        next(errorHandler(500, "Internal Server Error"));
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        res.status(200).send("")
    } catch (error) {
        next(errorHandler(500, "Internal Server Error"));
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        res.status(200).send("")
    } catch (error) {
        next(errorHandler(500, "Internal Server Error"));
    }
};

module.exports = {createEmployee, getEmployeeById, updateEmployee, deleteEmployee};