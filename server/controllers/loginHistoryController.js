const asyncHandler = require("../middlewares/utlis/asyncHandler");
const loginHistoryService = require("../services/loginHistoryService");
const { getPagination } = require("../utilities/pagination");
const {getIDFromMap} = require("../utilities/idUtils");
const { errorHandler } = require("../middlewares/error/errorHandler");
const logger = require("../utilities/logger");

const getLoginHistory = asyncHandler(async (req, res) => {
    try {
        const { hashedEmployeeID, startDate, endDate } = req.query;
        const { page, limit, offset } = getPagination(req);
        
        const originalEmployeeId = hashedEmployeeID ? await getIDFromMap(hashedEmployeeID, 'employees') : null;
        
        const { logs, totalRecords, totalPages } = await loginHistoryService.fetchLoginHistory({
            originalEmployeeId,
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
            data: logs
        });
    } catch (error) {
        logger.error('Error fetching login history:', error);
        errorHandler(500, res, error.message || 'Failed to fetch login history');
    }
});

module.exports = { getLoginHistory };