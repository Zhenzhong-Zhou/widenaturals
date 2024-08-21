const asyncHandler = require("../middlewares/asyncHandler");
const {hash} = require("bcrypt");
const {query} = require("../database/database");
const logger = require("../utilities/logger");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/errorHandler");
const {createEmployeeHandler} = require("../services/employeeService");
const {getIDFromMap} = require("../utilities/idUtils");
const {getRoleDetails} = require("../services/roleService");

const createEmployeeAdmin = asyncHandler(async (req, res, next) => {
    try {
        const hashedEmployeeId = req.employee.sub;
        const hashedRoleId = req.employee.role;
        const permissions = req.permissions;
        const { firstName, lastName, email, phoneNumber, password, jobTitle, roleName } = req.body;
        
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

module.exports = {createEmployeeAdmin};