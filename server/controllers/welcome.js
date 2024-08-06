const {errorHandler} = require("../utilities/errorHandler");
const welcome = async (req, res, next) => {
    try {
        res.status(200).send("Welcome to use the server of WIDE Naturals INC. Enterprise Resource Planning.")
    } catch (error) {
        next(errorHandler(500, "Internal Server Error"));
    }
}

module.exports = welcome;