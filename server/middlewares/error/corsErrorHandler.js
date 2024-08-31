const logger = require('../../utilities/logger');
const {CustomError} = require('../error/errorHandler');

const corsErrorHandler = (err, req, res, next) => {
    if (err instanceof CustomError && err.statusCode === 403) {
        logger.error('CORS error', {
            context: 'CORS',
            origin: req.headers.origin,
            error: err.message,
        });
        res.status(403).send('Forbidden by CORS');
    } else {
        next(err);
    }
};

module.exports = corsErrorHandler;