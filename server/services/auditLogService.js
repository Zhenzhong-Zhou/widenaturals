const auditLogDAL = require('../dal/logManagement/auditLogDAL');
const { validateDateRange } = require('../utilities/validator/validateDateRange');
const { errorHandler } = require("../middlewares/errorHandler");
const maskInfo = require("../utilities/maskInfo");
const logger = require("../utilities/logger");

// todo add logger and hash id and mask id => enhance add try block?
const fetchAuditLogs = async ({ tableName, employeeId, startDate, endDate, limit, offset }) => {
    // Validate and sanitize inputs
    if (startDate && endDate) {
        validateDateRange(startDate, endDate);
    }
    
    // Count the total number of records
    const totalRecords = await auditLogDAL.countAuditLogs({ tableName, employeeId, startDate, endDate });
    
    if (totalRecords === 0) {
        throw errorHandler(404, 'No audit logs found');
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / limit);
    
    // Fetch the audit logs with the given filters and pagination
    const logs = await auditLogDAL.getAuditLogs({ tableName, employeeId, startDate, endDate, limit, offset });
    
    if (!logs || logs.length === 0) {
        errorHandler(404, 'No audit logs found');
    }
    
    // Mask sensitive information in the logs before returning
    const maskedLogs = logs.map(log => {
        // Mask the audit log ID itself
        log.id = maskInfo.maskSensitiveInfo(log.id);
        
        // Mask the table name and any potentially sensitive information
        log.table_name = maskInfo.maskField('table_name', log.table_name);
        
        if (log.employee_id) {
            log.employee_id = maskInfo.maskSensitiveInfo(log.employee_id);
        }
        
        if (log.record_id) {
            log.record_id = maskInfo.maskSensitiveInfo(log.record_id);
        }
        
        // Mask any other sensitive information in old_data and new_data (if they are objects)
        if (log.old_data) {
            log.old_data = maskInfo.maskSensitiveInfo(JSON.stringify(log.old_data));
        }
        
        if (log.new_data) {
            log.new_data = maskInfo.maskSensitiveInfo(JSON.stringify(log.new_data));
        }
        
        return {
            logs,
            totalRecords,
            totalPages
        };
    });
    
    return maskedLogs;
};

module.exports = {
    fetchAuditLogs,
};