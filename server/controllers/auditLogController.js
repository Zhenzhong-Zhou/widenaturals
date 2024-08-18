const asyncHandler = require("../middlewares/asyncHandler");
const auditLogService = require("../services/auditLogService");
const { getPagination } = require("../utilities/pagination");
const { errorHandler } = require("../middlewares/errorHandler");
const logger = require("../utilities/logger");

const getAuditLogs = asyncHandler(async (req, res) => {
    try {
        const { tableName, employeeId, startDate, endDate } = req.query;
        const { page, limit } = getPagination(req);
        
        const logs = await auditLogService.fetchAuditLogs({
            tableName,
            employeeId,
            startDate,
            endDate,
            page,
            limit
        });
        
        res.json({
            page,
            limit,
            data: logs
        });
    } catch (error) {
        logger.error('Error fetching audit logs:', error);
        errorHandler(500, res, error.message || 'Failed to fetch audit logs');
    }
});

module.exports = { getAuditLogs };