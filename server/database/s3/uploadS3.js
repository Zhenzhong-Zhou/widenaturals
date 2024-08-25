const path = require('path');
const fs = require('fs');
const {PutObjectCommand} = require('@aws-sdk/client-s3');
const s3Client = require('./s3Client');
const { Upload } = require('@aws-sdk/lib-storage');
const logger = require('../../utilities/logger');

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
        logger.info(`Successfully uploaded file to ${bucketName}/${key}`);
        return response;
    } catch (error) {
        logger.error('Error uploading log to S3:', error);
        throw error;
    }
};

const uploadEmployeeProfileImageToS3 = async (file, uniqueFilename) => {
    const baseDir = path.resolve(__dirname, '../../uploads');  // Set a base directory for uploads
    const resolvedPath = path.resolve(baseDir, file);  // Resolve full path within the base directory
    
    try {
        // Ensure the resolved path is still within the base directory to prevent directory traversal
        if (!resolvedPath.startsWith(baseDir)) {
            throw new Error('Invalid file path');
        }
        
        // Ensure the file exists and is not a directory or symbolic link
        const stat = fs.statSync(resolvedPath);
        if (!stat.isFile()) {
            throw new Error(`Path is not a file: ${resolvedPath}`);
        }
        
        // Create a read stream for the file
        const fileStream = fs.createReadStream(resolvedPath);
        
        // Use @aws-sdk/lib-storage for better handling of streams
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `profile_image/${uniqueFilename}`,
                Body: fileStream,
                ContentType: file.mimetype,
            },
        });
        
        await upload.done();
        
        // Safely delete the file after successful upload
        fs.unlinkSync(resolvedPath);
        
        return `profile_image/${uniqueFilename}`;
    } catch (error) {
        logger.error('Error during S3 upload:', error.message);
        throw new Error('Error uploading file to S3: ' + error.message);
    }
};

module.exports = {uploadLogToS3, uploadEmployeeProfileImageToS3};