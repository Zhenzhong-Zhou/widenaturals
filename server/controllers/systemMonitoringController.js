const asyncHandler = require("../middlewares/asyncHandler");
const systemMonitoringService = require("../services/logManagement/systemMonitoringService");
const { getPagination } = require("../utilities/pagination");
const { getIDFromMap } = require("../utilities/idUtils");
const { getNonDescriptiveTableName } = require("../services/tableService");
const { errorHandler } = require("../middlewares/errorHandler");
const logger = require("../utilities/logger");

const getSystemMonitoringData = asyncHandler(async (req, res) => {
    try {
        const {
            tableName, employeeId, startDate, endDate, roleId, action,
            context, status, resourceType, ipAddress, userAgent, recordID, permission, method
        } = req.query;
        
        const { page, limit, offset } = getPagination(req);
        
        // todo later change from req object
        // Ensure the userRole is securely extracted from the request
        const employeeRole ='admin'; // Extracted from authentication middleware, not query params
        
        if (req.getAllLogs) {
            // No filters provided, fetch all logs
            const { logs, totalRecords, totalPages } = await systemMonitoringService.fetchSystemMonitor({ limit, offset });
            return res.status(200).json({ page, limit, totalRecords, totalPages, data: logs });
        }
        
        // todo later change from req object
        // Perform a role and permission check before proceeding
        // if (!await checkPermission(employeeRole, 'view_system_monitoring')) {
        //     return res.status(403).json({ message: 'Access denied' });
        // }
        
        // Fetch the system monitor logs
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
        
        // Return results to the client
        res.status(200).json({
            page,
            limit,
            totalRecords,
            totalPages,
            data: logs
        });
        
        // Log the access for auditing
        logger.info('System monitoring data accessed', {
            // user: req.user.id,  // todo later change from req object
            filters: req.query,
        });
    } catch (error) {
        logger.error('Error fetching system monitoring data:', error);
        errorHandler(500, 'Failed to fetch system monitoring data');
    }
});

module.exports = { getSystemMonitoringData };