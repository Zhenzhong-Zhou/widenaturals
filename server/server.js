if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const config = require('config');
const express = require("express");
const cors = require('cors');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { celebrate, Joi, errors } = require('celebrate');
const { welcomeRoutes } = require('./routes');
const logger = require('./logger');
const asyncHandler = require('./middlewares/asyncHandler');

const app = express();

// Environment variable validation
const envVarsSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
}).unknown().required();

const { error } = envVarsSchema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

// Security middlewares
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

// Body parser middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || config.get('cors.allowedOrigins').includes(origin)) {
            callback(null, true);
        } else {
            logger.warn("Blocked CORS for:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Routes
app.use("/api/v1/welcome", welcomeRoutes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Centralized error handling
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const details = err.details || null;
    
    // Log the error
    logger.error({
        message: err.message,
        status: statusCode,
        stack: err.stack
    });
    
    res.status(statusCode).json({
        status: "error",
        success: false,
        statusCode,
        message,
        ...(details && { details })
    });
    
    if (process.env.NODE_ENV === 'development') {
        logger.error(err); // Log error stack in development
    }
});

// Celebrate errors handling
app.use(errors());

// Server Running
const port = config.get('server.port');
app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});

// Export the app instance
module.exports = app;