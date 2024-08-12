const {PutObjectCommand} = require('@aws-sdk/client-s3');
const s3Client = require('./s3Client');
const path = require('path');

const uploadLogToS3 = async (buffer, bucketName, folder = 'logs', fileName) => {
    // Ensure fileName is unique, if not already done elsewhere
    const uniqueFileName = `${Date.now()}-${fileName}`;
    
    // Construct the S3 key with folder and filename
    const key = folder ? path.join(folder, uniqueFileName) : uniqueFileName;
    
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'application/gzip', // Adjust as needed
    });
    
    try {
        const response = await s3Client.send(command);
        console.log(`Successfully uploaded file to ${bucketName}/${key}`);
        return response;
    } catch (error) {
        console.error('Error uploading log to S3:', error);
        throw error;
    }
};

module.exports = {uploadLogToS3};