const asyncHandler = require("../middlewares/asyncHandler");
const auditLogService = require("../services/auditLogService");
const { getPagination } = require("../utilities/pagination");
const { getIDFromMap } = require("../utilities/idUtils");
const { getNonDescriptiveTableName } = require("../services/tableService");
const { errorHandler } = require("../middlewares/errorHandler");
const logger = require("../utilities/logger");

const getAuditLogs = asyncHandler(async (req, res) => {
    try {
        const { nonDescriptiveTableName, hashedEmployeeID, startDate, endDate } = req.query;
        const { limit, offset } = getPagination(req);
        
        // Basic validation at the controller level
        let originalEmployeeId = null;
        let tableName = null;
        
        if (hashedEmployeeID) {
            originalEmployeeId = await getIDFromMap(hashedEmployeeID, 'employees');
        }
        
        if (nonDescriptiveTableName) {
            tableName = getNonDescriptiveTableName(nonDescriptiveTableName);
        }
        
        // Call the service layer to fetch audit logs
        const { logs, totalRecords, totalPages } = await auditLogService.fetchAuditLogs({
            tableName,
            employeeId: originalEmployeeId,
            startDate,
            endDate,
            limit,
            offset
        });
        
        // Return results to the client
        res.status(200).json({
            page: req.query.page || 1,
            limit,
            totalRecords,
            totalPages,
            data: logs
        });
    } catch (error) {
        logger.error('Error fetching audit logs:', error);
        errorHandler(500, error.message || 'Failed to fetch audit logs');
    }
});

module.exports = { getAuditLogs };