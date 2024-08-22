const asyncHandler = require("../middlewares/utlis/asyncHandler");
const tokenService = require("../services/tokenService");
const { getPagination } = require("../utilities/pagination");
const { errorHandler } = require("../middlewares/error/errorHandler");
const logger = require("../utilities/logger");

const getTokens = asyncHandler(async (req, res) => {
    try {
        const { employeeId, tokenType, startDate, endDate } = req.query;
        const { page, limit, offset } = getPagination(req);
        
        const { tokens, totalRecords, totalPages } = await tokenService.fetchTokens({
            employeeId,
            tokenType,
            startDate,
            endDate,
            limit,
            offset
        });
        
        res.status(200).json({
            page,
            limit,
            totalRecords,
            totalPages,
            data: tokens
        });
    } catch (error) {
        logger.error('Error fetching tokens:', error);
        errorHandler(500, res, error.message || 'Failed to fetch tokens');
    }
});

const getTokenLogs = asyncHandler(async (req, res) => {
    try {
        const { id: tokenId } = req.params;
        const { page, limit, offset } = getPagination(req);
        
        const { logs, totalRecords, totalPages } = await tokenService.fetchTokenLogs({
            tokenId,
            limit,
            offset
        });
        
        res.status(200).json({
            page,
            limit,
            totalRecords,
            totalPages,
            data: logs
        });
    } catch (error) {
        logger.error('Error fetching token logs:', error);
        errorHandler(500, res, error.message || 'Failed to fetch token logs');
    }
});

module.exports = { getTokens, getTokenLogs };