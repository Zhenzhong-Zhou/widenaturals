const { createLogger, format, transports } = require('winston');
const path = require('path');
const {uploadLogToS3} = require('../database/s3/uploadS3');
const { Writable } = require('stream');

const s3UploadStream = new Writable({
    write(chunk, encoding, callback) {
        // Convert the chunk to a buffer and upload it
        uploadLogToS3(chunk, process.env.S3_BUCKET_NAME)
            .then(() => callback())
            .catch(callback);
    }
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'system-service' }, // Use a general name or specify a service
    transports: [
        new transports.File({ filename: path.join(__dirname, 'logs', 'error.log'), level: 'error' }),
        new transports.File({ filename: path.join(__dirname, 'logs', 'combined.log') })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.simple()
        )
    }));
} else {
    logger.add(new transports.Stream({
        stream: s3UploadStream,
        level: 'info' // Adjust the log level as needed
    }));
}

module.exports = logger;