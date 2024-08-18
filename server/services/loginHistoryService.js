const loginHistoryDAL = require('../dal/logManagement/loginHistoryDAL');
const { validateDateRange } = require('../utilities/validator/validateDateRange');
const { errorHandler } = require("../middlewares/errorHandler");
const logger = require("../utilities/logger");

const fetchLoginHistory = async ({ employeeId, startDate, endDate, limit, offset }) => {
    try {
        if (startDate && endDate) {
            validateDateRange(startDate, endDate);
        }
        
        const totalRecords = await loginHistoryDAL.countLoginHistory({ employeeId, startDate, endDate });
        
        if (totalRecords === 0) {
            logger.warn('No login history found', { employeeId, startDate, endDate });
            return { logs: [], totalRecords: 0, totalPages: 0 };
        }
        
        const totalPages = Math.ceil(totalRecords / limit);
        const logs = await loginHistoryDAL.getLoginHistory({ employeeId, startDate, endDate, limit, offset });
        
        logger.info('Login history successfully retrieved', { totalRecords, totalPages });
        
        return {
            logs,
            totalRecords,
            totalPages
        };
    } catch (error) {
        logger.error('Error fetching login history', { error: error.message });
        throw errorHandler(500, 'Failed to fetch login history');
    }
};

module.exports = {
    fetchLoginHistory,
};