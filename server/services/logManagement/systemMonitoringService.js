const systemMonitoringDAL = require('../../dal/logManagement/systemMonitoringDAL');
const { validateDateRange } = require('../../utilities/validators/validateDateRange');
const { errorHandler } = require("../../middlewares/errorHandler");
const maskInfo = require("../../utilities/maskInfo");
const logger = require("../../utilities/logger");

const fetchSystemMonitor = async ({ tableName, employeeId, roleId, startDate, endDate, action, context, status, resourceType, ipAddress, userAgent, recordId, permission, method, employeeRole,limit, offset, getAllLogs }) => {
    try {
        if (getAllLogs) {
            return await fetchSystemMonitor({ limit, offset });
        }
        
        // Validate and sanitize inputs if applicable
        if (startDate && endDate) {
            validateDateRange(startDate, endDate);
        }
        
        // Count the total number of records
        const totalRecords = await systemMonitoringDAL.countSystemMonitor({
            tableName,
            employeeId,
            roleId,
            startDate,
            endDate,
            employeeRole,
            action,
            context,
            status,
            resourceType,
            ipAddress,
            userAgent,
            recordId,
            permission,
            method
        });
        
        if (!totalRecords || totalRecords === 0) {
            logger.warn('No system monitor logs found', { tableName, employeeId, startDate, endDate });
            return { logs: [], totalRecords: 0, totalPages: 0 };
        }
        
        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / limit);
        
        // Fetch the system monitor logs with the given filters and pagination
        const logs = await systemMonitoringDAL.getSystemMonitor({
            tableName,
            employeeId,
            roleId,
            startDate,
            endDate,
            action,
            context,
            status,
            resourceType,
            ipAddress,
            userAgent,
            recordId,
            permission,
            method,
            employeeRole,
            limit,
            offset
        });
        
        // Ensure logs is an array to avoid errors
        if (!logs || !Array.isArray(logs)) {
            logger.warn('System monitor logs query returned undefined or null', { tableName, employeeId, startDate, endDate });
            return { logs: [], totalRecords, totalPages };
        }
        
        const maskedData = maskInfo.maskDataArray(logs);
        
        return {
            logs: maskedData,
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