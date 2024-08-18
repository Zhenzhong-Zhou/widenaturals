const asyncHandler = require("../middlewares/asyncHandler");
const auditLogService = require("../services/auditLogService");
const { getPagination } = require("../utilities/pagination");
const {getIDFromMap} = require("../utilities/idUtils");
const {getNonDescriptiveTableName} = require("../services/tableService");
const { errorHandler } = require("../middlewares/errorHandler");
const logger = require("../utilities/logger");

const getAuditLogs = asyncHandler(async (req, res) => {
    try {
        const { nonDescriptiveTableName, hashedEmployeeID, startDate, endDate } = req.query;
        const { page, limit, offset } = getPagination(req);
        
        let originalEmployeeId = null;
        let tableName = null;
        
        // Handle optional filters
        if (hashedEmployeeID) {
            originalEmployeeId = await getIDFromMap(hashedEmployeeID, 'employees');
        }
        
        if (nonDescriptiveTableName) {
            tableName = getNonDescriptiveTableName(nonDescriptiveTableName);
        }
        
        // Fetch the audit logs
        const logResults = await auditLogService.fetchAuditLogs({
            tableName,
            originalEmployeeId,
            startDate,
            endDate,
            limit,
            offset
        });
        
        const {logs, totalRecords, totalPages} = logResults[0];
        
        res.json({
            page,
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