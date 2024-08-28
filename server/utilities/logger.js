const { createLogger, format, transports } = require('winston');
const path = require('path');
const { uploadLogToS3 } = require('../database/s3/uploadS3');
const { Writable } = require('stream');
const zlib = require('zlib');

// Helper function to compress logs before uploading
function compressLogs(logMessage) {
    return new Promise((resolve, reject) => {
        zlib.gzip(logMessage, (err, compressed) => {
            if (err) reject(err);
            else resolve(compressed);
        });
    });
}

// Create a writable stream for S3 uploads with batching
class S3UploadStream extends Writable {
    constructor(options = {}) {
        super(options);
        this.buffer = '';
        this.uploadInterval = setInterval(this.flushLogs.bind(this), 60000); // Flush every 60 seconds
    }
    
    _write(chunk, encoding, callback) {
        this.buffer += chunk.toString('utf8');
        if (this.buffer.length > 1024 * 1024) { // Flush if buffer exceeds 1MB
            this.flushLogs().then(callback).catch(callback);
        } else {
            callback();
        }
    }
    
    async flushLogs() {
        if (this.buffer.length === 0) return;
        
        const logMessage = this.buffer;
        this.buffer = ''; // Reset buffer after flushing
        
        try {
            const compressedLogs = await compressLogs(logMessage);
            const date = new Date();
            const fileName = `logfile-${Date.now()}.gz`; // Ensure a unique filename with timestamp
            const folder = `logs/${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
            const bucketName = process.env.S3_BUCKET_NAME; // Ensure you have this environment variable set
            
            // Call the new uploadLogToS3 function
            await uploadLogToS3(compressedLogs, bucketName, folder, fileName);
            console.log('Flushed logs to S3:', path.join(folder, fileName));
        } catch (err) {
            logger.error('Failed to upload log to S3:', err);
        }
    }
    
    _final(callback) {
        this.flushLogs().then(() => {
            clearInterval(this.uploadInterval);
            callback();
        }).catch(callback);
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
            filename: path.join(__dirname, '..', 'logs', 'error.log'),
            level: 'error',
            handleExceptions: true, // Ensure exceptions are logged
            maxsize: 5242880, // 5MB
            maxFiles: 5, // Rotate files to keep only the latest 5
        }),
        new transports.File({
            filename: path.join(__dirname, '..', 'logs', 'combined.log'),
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
    // Add S3 transport in production environments with batching and compression
    logger.add(new transports.Stream({
        stream: s3UploadStream,
        level: 'info', // Adjust the log level as needed
        handleExceptions: true,
    }));
}

module.exports = logger;