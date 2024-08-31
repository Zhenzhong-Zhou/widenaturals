const {S3Client, ListBucketsCommand} = require('@aws-sdk/client-s3');

(async () => {
    try {
        const s3Client = new S3Client({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
            region: process.env.AWS_REGION,
        });
        
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        console.log('S3 Buckets:', response.Buckets);
    } catch (error) {
        console.error('Error accessing S3:', error);
    }
})();