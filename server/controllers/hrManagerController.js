const asyncHandler = require("../middlewares/asyncHandler");
const {query} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");
const {createEmployeeHandler} = require("../services/employeeService");
const {getIDFromMap} = require("../utilities/idUtils");
const {fetchRolesAvailableToHR, getRoleDetails} = require("../services/roleService");
const {canHrAssignRole} = require("../dal/roles/roleDAL");
const {getRoleIdsByNames} = require("../utilities/helpers/roleHelper");

const createEmployeeHR = asyncHandler(async (req, res, next) => {
    try {
        const hashedEmployeeId = req.employee.sub;
        const hashedRoleId = req.employee.role;
        const permissions = req.permissions;
        
        const { first_name: firstName, last_name: lastName, email, phone_number: phoneNumber, password, job_title: jobTitle, role_name: roleName } = req.body;
        
        const employeeId = await getIDFromMap(hashedEmployeeId, 'employees');
        const {id} = await getRoleDetails({name: roleName});
        
        const employee = await createEmployeeHandler({
            createdBy: employeeId,
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            jobTitle,
            roleId: id,
            hashedRoleId,
            permissions
        });
        
        res.status(201).json({ message: 'Employee created successfully', data: employee });
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

module.exports = {createEmployeeHR, getEmployeeById, updateEmployee, deleteEmployee};