const asyncHandler = require("../middlewares/utils/asyncHandler");
const systemMonitoringService = require("../services/logManagement/systemMonitoringService");
const {getPagination} = require("../utilities/pagination");
const {errorHandler} = require("../middlewares/error/errorHandler");
const logger = require("../utilities/logger");
const {logAuditAction} = require("../utilities/log/auditLogger");
const {createLoginDetails} = require("../utilities/log/logDetails");
const employeeService = require("../services/employeeService");
const roleService = require("../dal/roles/roleDAL");

const getSystemMonitoringData = asyncHandler(async (req, res) => {
    try {
        const originalEmployeeId = req.employee;
        const originalRoleId = req.role;
        const {
            tableName, employeeName, startDate, endDate, roleName, action,
            context, status, resourceType, ipAddress, userAgent, recordID, permission, method
        } = req.body;  // Use req.body instead of req.query
        
        const {page, limit, offset} = getPagination(req);
        
        const employeeId = await employeeService.getEmployeeByFullName(employeeName);
        const roleId = await roleService.getRoleById(roleName);
        
        if (req.getAllLogs) {
            // No filters provided, fetch all logs
            const {logs, totalRecords, totalPages} = await systemMonitoringService.fetchSystemMonitor({limit, offset});
            const logDetails = createLoginDetails(
                req.get('User-Agent'), // userAgent
                'system access', // method
                'Unknown', // location
                'view_system_logs', // actionType
                {
                    description: 'User viewed all system logs without any filters',
                    ipAddress: req.ip,
                    requestData: req.body, // Use request body for context
                    timestamp: new Date().toISOString() // Include timestamp
                }
            );
            
            await logAuditAction('all_system_logs', 'multiple tables', 'view_system_logs', originalRoleId, originalEmployeeId, logDetails);
            
            // Log the access for auditing before sending the response
            logger.info('System monitoring data accessed', {
                user: req.employee?.sub,
                role: req.employee?.role,
                filters: req.body, // Use body for logging filters
            });
            
            return res.status(200).json({page, limit, totalRecords, totalPages, data: logs});
        }
        
        // Fetch the system monitor logs with the provided filters
        const {logs, totalRecords, totalPages} = await systemMonitoringService.fetchSystemMonitor({
            tableName,
            employeeId,
            roleId,
            startDate,
            endDate,
            action,
            context,
            status,
            resourceType,
            ipAddress,
            userAgent,
            recordID,
            permission,
            method,
            limit,
            offset
        });
        
        const logDetails = createLoginDetails(
            req.get('User-Agent'), // userAgent
            'system access', // method
            'Unknown', // location
            'view_system_logs', // actionType
            {
                description: 'User viewed all system logs with some filters',
                ipAddress: req.ip,
                requestData: req.body, // Use request body for context
                timestamp: new Date().toISOString() // Include timestamp
            }
        );
        
        await logAuditAction('filter_system_logs', 'multiple tables', 'view_system_logs', originalRoleId, originalEmployeeId, logDetails);
        
        // Log the access for auditing
        logger.info('System monitoring data accessed', {
            user: req.employee?.sub,
            role: req.employee?.role,
            filters: req.body, // Use body for logging filters
        });
        
        // Return the results to the client
        res.status(200).json({
            page,
            limit,
            totalRecords,
            totalPages,
            data: logs
        });
    } catch (error) {
        logger.error('Error fetching system monitoring data:', error);
        errorHandler(res, 500, 'Failed to fetch system monitoring data');
    }
});

module.exports = {getSystemMonitoringData};