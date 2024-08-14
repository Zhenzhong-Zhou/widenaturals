const asyncHandler = require("../middlewares/asyncHandler");
const {query} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");
const {createUser} = require("../services/employeeService");
const {getIDFromMap} = require("../utilities/idUtils");

const createEmployee = asyncHandler(async (req, res, next) => {
    const hashedId = req.employee.sub;
    const {firstName, lastName, email, phoneNumber, password, jobTitle} = req.body;
    
    const employeeId = await getIDFromMap(hashedId, 'employees');
    const createdBy = employeeId[0].original_id;

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