const asyncHandler = require("../middlewares/asyncHandler");
const loginHistoryService = require("../services/loginHistoryService");
const { getPagination } = require("../utilities/pagination");
const { errorHandler } = require("../middlewares/errorHandler");
const logger = require("../utilities/logger");

const getLoginHistory = asyncHandler(async (req, res) => {
    try {
        const { employeeId, startDate, endDate } = req.query;
        const { limit, offset } = getPagination(req);
        
        const { logs, totalRecords, totalPages } = await loginHistoryService.fetchLoginHistory({
            employeeId,
            startDate,
            endDate,
            limit,
            offset
        });
        
        res.status(200).json({
            page: req.query.page || 1,
            limit,
            totalRecords,
            totalPages,
            data: logs
        });
    } catch (error) {
        logger.error('Error fetching login history:', error);
        errorHandler(500, res, error.message || 'Failed to fetch login history');
    }
});

module.exports = { getLoginHistory };