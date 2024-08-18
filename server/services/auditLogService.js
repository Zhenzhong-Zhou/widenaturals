const auditLogDAL = require('../dal/logManagement/auditLogDAL');
const { validateDateRange } = require('../utilities/validators/validateDateRange');
const { errorHandler } = require("../middlewares/errorHandler");
const maskInfo = require("../utilities/maskInfo");
const logger = require("../utilities/logger");

const fetchAuditLogs = async ({ tableName, employeeId, startDate, endDate, limit, offset }) => {
    try {
        // Validate and sanitize inputs if applicable
        if (startDate && endDate) {
            validateDateRange(startDate, endDate);
        }
        
        // Count the total number of records
        const totalRecords = await auditLogDAL.countAuditLogs({ tableName, employeeId, startDate, endDate });
        
        if (totalRecords === 0) {
            logger.warn('No audit logs found', { tableName, employeeId, startDate, endDate });
            return { logs: [], totalRecords: 0, totalPages: 0 };
        }
        
        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / limit);
        
        // Fetch the audit logs with the given filters and pagination
        const logs = await auditLogDAL.getAuditLogs({ tableName, employeeId, startDate, endDate, limit, offset });
        
        // Mask sensitive information in the logs before returning
        const maskedLogs = logs.map(log => {
            log.id = maskInfo.maskSensitiveInfo(log.id);
            log.table_name = maskInfo.maskField('table_name', log.table_name);
            if (log.employee_id) {
                log.employee_id = maskInfo.maskSensitiveInfo(log.employee_id);
            }
            if (log.record_id) {
                log.record_id = maskInfo.maskSensitiveInfo(log.record_id);
            }
            if (log.old_data) {
                log.old_data = maskInfo.maskSensitiveInfo(JSON.stringify(log.old_data));
            }
            if (log.new_data) {
                log.new_data = maskInfo.maskSensitiveInfo(JSON.stringify(log.new_data));
            }
            return log;
        });
        
        return {
            logs: maskedLogs,
            totalRecords,
            totalPages
        };
    } catch (error) {
        logger.error('Error fetching audit logs', { error: error.message });
        throw errorHandler(500, 'Failed to fetch audit logs');
    }
};

module.exports = {
    fetchAuditLogs,
};