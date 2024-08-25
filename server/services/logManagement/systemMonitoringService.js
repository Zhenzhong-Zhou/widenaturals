const systemMonitoringDAL = require('../../dal/logManagement/systemMonitoringDAL');
const { validateDateRange } = require('../../utilities/validators/validateDateRange');
const { errorHandler } = require("../../middlewares/error/errorHandler");
const maskInfo = require("../../utilities/maskInfo");
const logger = require("../../utilities/logger");

const fetchSystemMonitor = async ({ tableName, employeeId, roleId, startDate, endDate, action, context, status, resourceType, ipAddress, userAgent, recordId, permission, method, limit, offset, getAllLogs }) => {
    try {
        // Input Validation
        if (startDate && endDate) {
            validateDateRange(startDate, endDate);
        }
        
        // Log the input parameters for traceability
        logger.info('Fetching system monitor logs with parameters', {
            tableName, employeeId, roleId, startDate, endDate, action, context,
            status, resourceType, ipAddress, userAgent, recordId, permission, method, limit, offset, getAllLogs
        });
        
        // Count the total number of records
        const totalRecords = await systemMonitoringDAL.countSystemMonitor({
            tableName, employeeId, roleId, startDate, endDate, action,
            context, status, resourceType, ipAddress, userAgent, recordId, permission, method
        });
        
        if (!totalRecords || totalRecords === 0) {
            logger.warn('No system monitor logs found', { tableName, employeeId, startDate, endDate });
            return { logs: [], totalRecords: 0, totalPages: 0 };
        }
        
        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / limit);
        
        // Fetch the system monitor logs with the given filters and pagination
        const logs = await systemMonitoringDAL.getSystemMonitor({
            tableName, employeeId, roleId, startDate, endDate, action, context,
            status, resourceType, ipAddress, userAgent, recordId, permission, method, limit, offset
        });
        
        // Ensure logs is an array to avoid errors
        if (!Array.isArray(logs)) {
            logger.warn('System monitor logs query returned a non-array result', { tableName, employeeId, startDate, endDate });
            return { logs: [], totalRecords, totalPages };
        }
        
        // Mask sensitive data
        const maskedData = maskInfo.maskDataArray(logs);
        
        // Return the final response
        return {
            logs: maskedData,
            totalRecords,
            totalPages
        };
    } catch (error) {
        // Log the error with full stack trace for debugging
        logger.error('Error fetching system monitor logs', { error: error.message, stack: error.stack });
        throw errorHandler(500, 'Failed to fetch system monitor logs');
    }
};

module.exports = {
    fetchSystemMonitor,
};