const auditLogDAL = require('../dal/logManagement/auditLogDAL');
const { validateDateRange } = require('../utilities/validator/validateDateRange');
const { errorHandler } = require("../middlewares/errorHandler");
const logger = require("../utilities/logger");

const fetchAuditLogs = async ({ tableName, employeeId, startDate, endDate, limit = 100, offset = 0 }) => {
    // Validate and sanitize inputs
    if (startDate && endDate) {
        validateDateRange(startDate, endDate);
    }
    
    // Fetch the audit logs with the given filters
    const logs = await auditLogDAL.getAuditLogs({ tableName, employeeId, startDate, endDate, limit, offset });
    
    if (!logs || logs.length === 0) {
        throw errorHandler(404, 'No audit logs found');
    }
    
    return logs;
};

module.exports = {
    fetchAuditLogs,
};