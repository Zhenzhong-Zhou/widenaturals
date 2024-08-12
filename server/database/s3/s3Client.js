// Load environment variables from .env if not in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const {S3Client} = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION
});

module.exports = s3Client;