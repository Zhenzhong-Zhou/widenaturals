const asyncHandler = require("../middlewares/asyncHandler");
const {query} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");
const {createUser, createEmployeeHandler} = require("../services/employeeService");
const {getIDFromMap} = require("../utilities/idUtils");
const {fetchRolesAvailableToHR, getRoleDetails} = require("../services/roleService");
const {canHrAssignRole} = require("../dal/roles/roleDAL");
const {getRoleIdsByNames} = require("../utilities/helpers/roleHelper");

const createEmployeeHR = asyncHandler(async (req, res, next) => {
    try {
        const hashedEmployeeId = req.employee.sub;
        const hashedRoleId = req.employee.role;
        const { firstName, lastName, email, phoneNumber, password, jobTitle, roleName } = req.body;
        
        const employeeId = await getIDFromMap(hashedEmployeeId, 'employees');
        const createdBy = employeeId[0].original_id;
        
        const {id} = await getRoleDetails({name: roleName});
        
        // const isAssignable = await canHrAssignRole(roleName);
        //
        // if (!isAssignable) {
        //     return res.status(403).json({ message: 'Forbidden: HR cannot assign this role.' });
        // }
        //
        // const roleIds = await getRoleIdsByNames(roleName);
        // const roleId = roleIds[0];
        
        const employee = await createEmployeeHandler({
            createdBy,
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            jobTitle,
            roleId: id,
            hashedRoleId
            // roleId
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