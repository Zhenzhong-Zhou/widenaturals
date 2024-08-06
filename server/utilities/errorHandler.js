class CustomError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}

const errorHandler = (statusCode, message, details = null) => {
    throw new CustomError(statusCode, message, details);
};

const handleErrors = (err, req, res, next) => {
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({ message: err.message, details: err.details });
    }
    console.error(err);
    res.status(500).json({ message: "An internal server error occurred." });
};

module.exports = {
    CustomError,
    errorHandler,
    handleErrors
};