const { validationResult, query } = require('express-validator');
const {getIDFromMap} = require("../utilities/idUtils");
const {getNonDescriptiveTableName} = require("../services/tableService");

const validateSystemMonitorQuery = [
    // Validate each query parameter
    query('nonDescriptiveTableName').optional().isString(),
    query('hashedEmployeeID').optional().isString().isLength({ min: 1 }),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
    query('hashedRoleID').optional().isString().isLength({ min: 1 }),
    query('action').optional().isString(),
    query('context').optional().isString(),
    query('status').optional().isString(),
    query('resourceType').optional().isString(),
    query('ipAddress').optional().isIP(),
    query('userAgent').optional().isString(),
    query('recordID').optional().isString().isLength({ min: 1 }),
    query('permission').optional().isString(),
    query('method').optional().isString(),
    
    // Custom validation logic
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const queryParams = req.query;
        
        // Check if any filter is provided
        const isAnyFilterProvided = Object.keys(queryParams).length > 0;
        
        if (!isAnyFilterProvided) {
            // No filters provided, flag to get all logs
            req.getAllLogs = true;
        }
        
        if (queryParams.hashedEmployeeID) {
            req.query.employeeId = await getIDFromMap(queryParams.hashedEmployeeID, 'employees');
        }
        
        if (queryParams.hashedRoleID) {
            req.query.roleId = await getIDFromMap(queryParams.hashedRoleID, 'roles');
        }
        
        if (queryParams.nonDescriptiveTableName) {
            req.query.tableName = getNonDescriptiveTableName(queryParams.nonDescriptiveTableName);
        }
        
        next();
    }
];

module.exports = { validateSystemMonitorQuery };