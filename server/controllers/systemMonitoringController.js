const asyncHandler = require("../middlewares/asyncHandler");
const systemMonitoringService = require("../services/logManagement/systemMonitoringService");
const { getPagination } = require("../utilities/pagination");
const { getIDFromMap } = require("../utilities/idUtils");
const { getNonDescriptiveTableName } = require("../services/tableService");
const { errorHandler } = require("../middlewares/errorHandler");
const logger = require("../utilities/logger");

const getSystemMonitoringData = asyncHandler(async (req, res) => {
    try {
        const { nonDescriptiveTableName, hashedEmployeeID, startDate, endDate, roleId, action, context } = req.query;
        const { page, limit, offset } = getPagination(req);
        
        // Extract userRole from the request (assumed to be set by middleware)
        // const employeeRole = req.user.role;
        
        // Basic validation at the controller level
        let originalEmployeeId = null;
        let tableName = null;
        
        if (hashedEmployeeID) {
            originalEmployeeId = await getIDFromMap(hashedEmployeeID, 'employees');
        }
        
        if (nonDescriptiveTableName) {
            tableName = getNonDescriptiveTableName(nonDescriptiveTableName);
        }
        
        // Call the service layer to fetch system monitor logs
        const { logs, totalRecords, totalPages } = await systemMonitoringService.fetchSystemMonitor({
            tableName,
            employeeId: originalEmployeeId,
            roleId,
            startDate,
            endDate,
            action,
            context,
            employeeRole : 'admin',
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
    } catch (error) {
        logger.error('Error fetching system monitoring data:', error);
        errorHandler(500, error.message || 'Failed to fetch system monitoring data');
    }
});

module.exports = { getSystemMonitoringData };