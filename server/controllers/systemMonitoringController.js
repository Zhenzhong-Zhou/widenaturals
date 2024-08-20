const asyncHandler = require("../middlewares/asyncHandler");
const systemMonitoringService = require("../services/logManagement/systemMonitoringService");
const { getPagination } = require("../utilities/pagination");
const { getRoleDetails } = require("../services/roleService");
const { errorHandler } = require("../middlewares/errorHandler");
const logger = require("../utilities/logger");
const {logAuditAction} = require("../utilities/log/auditLogger");
const {getIDFromMap} = require("../utilities/idUtils");
const {createLoginDetails} = require("../utilities/log/logDetails");

const getSystemMonitoringData = asyncHandler(async (req, res) => {
    try {
        const originalEmployeeId = await getIDFromMap(req.employee.sub, 'employees');
        const originalRoleId = await getIDFromMap(req.employee.role, 'roles');
        const {
            tableName, employeeId, startDate, endDate, roleId, action,
            context, status, resourceType, ipAddress, userAgent, recordID, permission, method
        } = req.query;
        const { page, limit, offset } = getPagination(req);
        
        let employeeRole = null;
        
        // Check if roleId is provided before fetching role details
        if (roleId) {
            const roleDetails = await getRoleDetails({ id: roleId });
            employeeRole = roleDetails?.name || null;
        }
        
        if (req.getAllLogs) {
            // No filters provided, fetch all logs
            const { logs, totalRecords, totalPages } = await systemMonitoringService.fetchSystemMonitor({ limit, offset });
            const logDetails = createLoginDetails(
                req.get('User-Agent'), // userAgent
                'system access', // method
                'Unknown', // location
                'view_system_logs', // actionType
                {
                    description: 'User viewed all system logs without any filters',
                    ipAddress: req.ip,
                    requestData: req.query, // Include the request query parameters for more context
                    timestamp: new Date().toISOString() // Include the timestamp when the action was performed
                }
            );
            
            await logAuditAction('all_system_logs', 'multiple tables', 'view_system_logs', originalRoleId, originalEmployeeId, logDetails);
            
            // Log the access for auditing before sending the response
            logger.info('System monitoring data accessed', {
                user: req.employee?.sub,
                role: req.employee?.role,
                filters: req.query,
            });
            
            return res.status(200).json({ page, limit, totalRecords, totalPages, data: logs });
        }
        
        // Fetch the system monitor logs with the provided filters
        const { logs, totalRecords, totalPages } = await systemMonitoringService.fetchSystemMonitor({
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
            employeeRole,
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
                requestData: req.query, // Include the request query parameters for more context
                timestamp: new Date().toISOString() // Include the timestamp when the action was performed
            }
        );
        
        await logAuditAction('filter_system_logs', 'multiple tables', 'view_system_logs', originalRoleId, originalEmployeeId, logDetails);
        
        // Log the access for auditing
        logger.info('System monitoring data accessed', {
            user: req.employee?.sub,
            role: req.employee?.role,
            filters: req.query,
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

module.exports = { getSystemMonitoringData };