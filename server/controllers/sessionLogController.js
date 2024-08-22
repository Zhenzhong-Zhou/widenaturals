const asyncHandler = require("../middlewares/utlis/asyncHandler");
const {errorHandler} = require("../middlewares/error/errorHandler");

const getSessionLogs = asyncHandler(async (req, res, next) => {
    try {
        res.status(200).send("")
    } catch (error) {
        next(errorHandler(500, "Internal Server Error"));
    }
});

module.exports = {getSessionLogs};