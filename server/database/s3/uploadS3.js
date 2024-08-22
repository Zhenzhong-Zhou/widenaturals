const {PutObjectCommand} = require('@aws-sdk/client-s3');
const s3Client = require('./s3Client');
const path = require('path');
const {createReadStream, unlinkSync} = require("node:fs");

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

const uploadEmployeeProfileImageToS3 = async (file, uniqueFilename) => {
    const s3Key = `profile_image/${uniqueFilename}`;
    
    try {
        const fileStream = createReadStream(file.path);
        
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key,
            Body: fileStream,
            ContentType: file.mimetype,
        };
        
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        
        // Optionally delete the file from local storage if not needed
        unlinkSync(file.path);
        
        return s3Key;  // Return only the S3 key (image path)
    } catch (error) {
        throw new Error('Error uploading file to S3: ' + error.message);
    }
};

module.exports = {uploadLogToS3, uploadEmployeeProfileImageToS3};