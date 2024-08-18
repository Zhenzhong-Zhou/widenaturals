const asyncHandler = require("../middlewares/asyncHandler");
const auditLogService = require("../services/auditLogService");
const {errorHandler} = require("../middlewares/errorHandler");
const logger = require("../utilities/logger");

const getAuditLogs = asyncHandler(async (req, res) => {
    try {
        const { tableName, employeeId, startDate, endDate } = req.query;
        
        if (tableName) {
            const logs = await auditLogService.fetchAuditLogsByTable(tableName);
            return res.json(logs);
        }
        
        if (employeeId) {
            const logs = await auditLogService.fetchAuditLogsByEmployee(employeeId);
            return res.json(logs);
        }
        
        if (startDate && endDate) {
            const logs = await auditLogService.fetchAuditLogsByDateRange(startDate, endDate);
            return res.json(logs);
        }
        
        const logs = await auditLogService.fetchAllAuditLogs();
        res.json(logs);
    } catch (error) {
        logger.error('Error fetching audit logs:', error);
        errorHandler(500, {error: 'Failed to fetch audit logs'});
    }
});

module.exports = {getAuditLogs};