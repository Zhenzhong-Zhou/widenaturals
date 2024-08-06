if (process.env.NODE_ENV === "development") {
    require("dotenv").config();
}

const express = require("express");
const cors = require('cors');
const helmet = require("helmet");
const morgan = require("morgan");

const {welcomeRoutes} = require('./routes');

const app = express();

// Security middlewares
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({policy: "cross-origin"}));

// Body parser middleware
app.use(express.json());

// Development-only middlewares
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Logging middleware for development
}

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Check if the origin is not present or is in the allowed list
        if (!origin || ['https://wide-naturals.ca', process.env.DEVELOPMENT_URL].includes(origin)) {
            callback(null, true);
        } else {
            console.log("Blocked CORS for:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],  // Explicitly specify methods
    allowedHeaders: ['Content-Type', 'Authorization'],  // Specify allowed header
    preflightContinue: false,
    optionsSuccessStatus: 204  // Some legacy browsers (IE11, various SmartTVs) choke on 204
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
    res.status(statusCode).json({
        status: "error",
        success: false,
        statusCode,
        message,
        ...(details && { details })
    });
    if (process.env.NODE_ENV === 'development') {
        console.error(err); // Log error stack in development
    }
});

// Server Running
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


// Export the app instance
module.exports = app;