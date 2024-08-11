// uploadToS3.js
const {PutObjectCommand} = require('@aws-sdk/client-s3');
const s3Client = require('./s3Client');
const {v4: uuidv4} = require('uuid'); // For generating unique filenames

const uploadLogToS3 = async (buffer, bucketName, folder = 'logs') => {
    try {
        const fileName = `${folder}/${uuidv4()}.log`; // Generating a unique file name
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: buffer,
            ContentType: 'application/json', // Adjust as needed
        });
        
        const response = await s3Client.send(command);
        console.log(`Successfully uploaded file to ${bucketName}/${fileName}`);
        return response;
    } catch (error) {
        console.error('Error uploading to S3:', error);
        throw error;
    }
};

module.exports = {uploadLogToS3};