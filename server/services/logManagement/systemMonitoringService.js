const systemMonitoringDAL = require('../../dal/logManagement/systemMonitoringDAL');
const { validateDateRange } = require('../../utilities/validators/validateDateRange');
const { errorHandler } = require("../../middlewares/errorHandler");
const maskInfo = require("../../utilities/maskInfo");
const logger = require("../../utilities/logger");

const fetchSystemMonitor = async ({ tableName, employeeId, roleId, startDate, endDate, action, context, userRole, limit, offset }) => {
    try {
        // Validate and sanitize inputs if applicable
        if (startDate && endDate) {
            validateDateRange(startDate, endDate);
        }
        
        // Count the total number of records
        const totalRecords = await systemMonitoringDAL.countSystemMonitor({ tableName, employeeId, roleId, startDate, endDate, action, context, userRole });
        
        if (!totalRecords || totalRecords === 0) {
            logger.warn('No system monitor logs found', { tableName, employeeId, startDate, endDate });
            return { logs: [], totalRecords: 0, totalPages: 0 };
        }
        
        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / limit);
        
        // Fetch the system monitor logs with the given filters and pagination
        const logs = await systemMonitoringDAL.getSystemMonitor({ tableName, employeeId, roleId, startDate, endDate, action, context, userRole, limit, offset });
        
        // Ensure logs is an array to avoid errors
        if (!logs || !Array.isArray(logs)) {
            logger.warn('System monitor logs query returned undefined or null', { tableName, employeeId, startDate, endDate });
            return { logs: [], totalRecords, totalPages };
        }
        
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
            // Mask any additional fields based on the type of log
            if (log.token_id) {
                log.token_id = maskInfo.maskSensitiveInfo(log.token_id);
            }
            if (log.session_id) {
                log.session_id = maskInfo.maskSensitiveInfo(log.session_id);
            }
            return log;
        });
        
        return {
            logs: maskedLogs,
            totalRecords,
            totalPages
        };
    } catch (error) {
        logger.error('Error fetching system monitor logs', { error: error.message });
        throw errorHandler(500, 'Failed to fetch system monitor logs');
    }
};

module.exports = {
    fetchSystemMonitor,
};