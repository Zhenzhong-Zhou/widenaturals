const tokenDAL = require('../dal/auth/tokenDAL');
const { validateDateRange } = require('../utilities/validators/validateDateRange');
const { errorHandler } = require("../middlewares/error/errorHandler");
const logger = require("../utilities/logger");

const fetchTokens = async ({ employeeId, tokenType, startDate, endDate, limit, offset }) => {
    try {
        if (startDate && endDate) {
            validateDateRange(startDate, endDate);
        }
        
        const totalRecords = await tokenDAL.countTokens({ employeeId, tokenType, startDate, endDate });
        
        if (totalRecords === 0) {
            logger.warn('No tokens found', { employeeId, tokenType, startDate, endDate });
            return { tokens: [], totalRecords: 0, totalPages: 0 };
        }
        
        const totalPages = Math.ceil(totalRecords / limit);
        const tokens = await tokenDAL.getTokens({ employeeId, tokenType, startDate, endDate, limit, offset });
        
        logger.info('Tokens successfully retrieved', { totalRecords, totalPages });
        
        return {
            tokens,
            totalRecords,
            totalPages
        };
    } catch (error) {
        logger.error('Error fetching tokens', { error: error.message });
        throw errorHandler(500, 'Failed to fetch tokens');
    }
};

const fetchTokenLogs = async ({ tokenId, limit, offset }) => {
    try {
        const totalRecords = await tokenDAL.countTokenLogs({ tokenId });
        
        if (totalRecords === 0) {
            logger.warn('No token logs found', { tokenId });
            return { logs: [], totalRecords: 0, totalPages: 0 };
        }
        
        const totalPages = Math.ceil(totalRecords / limit);
        const logs = await tokenDAL.getTokenLogs({ tokenId, limit, offset });
        
        logger.info('Token logs successfully retrieved', { totalRecords, totalPages });
        
        return {
            logs,
            totalRecords,
            totalPages
        };
    } catch (error) {
        logger.error('Error fetching token logs', { error: error.message });
        throw errorHandler(500, 'Failed to fetch token logs');
    }
};

module.exports = {
    fetchTokens,
    fetchTokenLogs,
};