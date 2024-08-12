const { createLogger, format, transports } = require('winston');
const path = require('path');
const { uploadLogToS3 } = require('../database/s3/uploadS3');
const { Writable } = require('stream');

// Create a writable stream for S3 uploads
class S3UploadStream extends Writable {
    constructor(options = {}) {
        super(options);
    }
    
    _write(chunk, encoding, callback) {
        // Convert the chunk to a string (if it's a buffer) and upload it
        const logMessage = chunk instanceof Buffer ? chunk.toString('utf8') : chunk;
        uploadLogToS3(logMessage, process.env.S3_BUCKET_NAME)
            .then(() => callback())
            .catch(err => {
                logger.error('Failed to upload log to S3:', err);
                callback(err);
            });
    }
}

const s3UploadStream = new S3UploadStream();

// Define log formats for different environments
const consoleFormat = format.combine(
    format.colorize(),
    format.simple()
);

const fileAndS3Format = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
);

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info', // Allow dynamic log level via environment variable
    format: fileAndS3Format,
    defaultMeta: { service: 'system-service', environment: process.env.NODE_ENV }, // Added environment info
    transports: [
        new transports.File({
            filename: path.join(__dirname, 'logs', 'error.log'),
            level: 'error',
            handleExceptions: true, // Ensure exceptions are logged
            maxsize: 5242880, // 5MB
            maxFiles: 5, // Rotate files to keep only the latest 5
        }),
        new transports.File({
            filename: path.join(__dirname, 'logs', 'combined.log'),
            handleExceptions: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    ],
    exitOnError: false, // Prevent the logger from exiting after logging an error
});

// Add Console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: consoleFormat,
        handleExceptions: true,
    }));
} else {
    // Add S3 transport in production environments
    logger.add(new transports.Stream({
        stream: s3UploadStream,
        level: 'info', // Adjust the log level as needed
        handleExceptions: true,
    }));
}

module.exports = logger;