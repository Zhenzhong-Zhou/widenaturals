const { validationResult, query } = require('express-validator');
const { getIDFromMap } = require("../utilities/idUtils");
const { getNonDescriptiveTableName } = require("../services/tableService");

const validateSystemMonitorQuery = [
    // Validate each query parameter
    query('nonDescriptiveTableName').optional().isString().trim(),
    query('hashedEmployeeID').optional().isString().trim().isLength({ min: 1 }),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
    query('hashedRoleID').optional().isString().trim().isLength({ min: 1 }),
    query('action').optional().isString().trim(),
    query('context').optional().isString().trim(),
    query('status').optional().isString().trim(),
    query('resourceType').optional().isString().trim(),
    query('ipAddress').optional().isIP(),
    query('userAgent').optional().isString().trim(),
    query('recordID').optional().isString().trim().isLength({ min: 1 }),
    query('permission').optional().isString().trim(),
    query('method').optional().isString().trim(),
    
    // Custom validation logic
    async (req, res, next) => {
        // Collect validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const queryParams = req.query;
        
        // Check if any filter is provided
        const isAnyFilterProvided = Object.keys(queryParams).length > 0;
        
        // Initialize req.getAllLogs early
        req.getAllLogs = !isAnyFilterProvided;
        
        try {
            // Resolve hashedEmployeeID to employeeId
            if (queryParams.hashedEmployeeID) {
                req.query.employeeId = await getIDFromMap(queryParams.hashedEmployeeID, 'employees');
            }
            
            // Resolve hashedRoleID to roleId
            if (queryParams.hashedRoleID) {
                req.query.roleId = await getIDFromMap(queryParams.hashedRoleID, 'roles');
            }
            
            // Resolve nonDescriptiveTableName to tableName
            if (queryParams.nonDescriptiveTableName) {
                req.query.tableName = getNonDescriptiveTableName(queryParams.nonDescriptiveTableName);
            }
            
            // Remove original hashed IDs and nonDescriptiveTableName from query to avoid redundant data
            delete req.query.hashedEmployeeID;
            delete req.query.hashedRoleID;
            delete req.query.nonDescriptiveTableName;
            
            // Proceed to the next middleware or route handler
            next();
        } catch (err) {
            // Handle any errors that occurred during ID resolution
            console.error("Error in validateSystemMonitorQuery:", err);
            return res.status(500).json({ error: 'An error occurred while processing your request.' });
        }
    }
];

module.exports = { validateSystemMonitorQuery };