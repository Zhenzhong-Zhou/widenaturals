const cors = require('cors');
const logger = require('./logger');
const {CustomError} = require('../middlewares/error/errorHandler');

const configureCors = (app, allowedOrigins) => {
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`Blocked CORS request from origin: ${origin}`, {
                    context: 'CORS',
                    origin: origin,
                    timestamp: new Date().toISOString(),
                    action: 'Blocked'
                });
                callback(new CustomError(403, 'Not allowed by CORS'), false);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    };
    
    app.use(cors(corsOptions)); // Apply CORS first
};

module.exports = configureCors;