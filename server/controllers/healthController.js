const os = require('os');
const fs = require('fs').promises;
const dns = require('dns').promises;
const { exec } = require('child_process');
const { HeadBucketCommand } = require('@aws-sdk/client-s3');
const asyncHandler = require("../middlewares/utils/asyncHandler");
const db = require("../database/database");
const s3Client = require("../database/s3/s3Client");
const logger = require("../utilities/logger");

// Function to check network latency
const checkNetworkLatency = async (host) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        exec(`ping -c 1 ${host}`, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(`Ping to ${host} failed: ${stderr}`));
            }
            const duration = Date.now() - start;
            resolve(duration);
        });
    });
};

// Function to check DNS resolution
const checkDNSResolution = async (host) => {
    try {
        return await dns.lookup(host);
    } catch (error) {
        throw new Error(`DNS resolution failed for ${host}: ${error.message}`);
    }
};

// Function to check S3 availability
const checkS3Availability = async (bucketName) => {
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        return { status: 'UP', message: 'S3 bucket is accessible' };
    } catch (error) {
        return { status: 'DOWN', message: `S3 bucket is not accessible: ${error.message}` };
    }
};

// Health check function
const healthCheck = asyncHandler(async (req, res) => {
    const healthDetails = {
        database: { status: 'UNKNOWN', message: '' },
        memoryUsage: { status: 'UNKNOWN', usage: null, message: '' },
        diskSpace: { status: 'UNKNOWN', free: null, message: '' },
        cpuLoad: { status: 'UNKNOWN', load: null, message: '' },
        networkLatency: { status: 'UNKNOWN', latency: null, message: '' },
        dnsResolution: { status: 'UNKNOWN', addresses: null, message: '' },
        s3: { status: 'UNKNOWN', message: '' },
        uptime: { status: 'UP', value: process.uptime(), message: 'System uptime is healthy' },
        timestamp: new Date().toISOString(),
    };
    
    // Check database health
    try {
        const healthStatus = await db.checkHealth();
        healthDetails.database.status = healthStatus.status;
        healthDetails.database.message = healthStatus.status === 'UP' ? 'Database is healthy' : `Database is unhealthy: ${healthStatus.message}`;
        
        if (healthStatus.status !== 'UP') {
            return res.status(503).json({status: 'DOWN', details: healthDetails});
        }
    } catch (error) {
        healthDetails.database.status = 'DOWN';
        healthDetails.database.message = `Database check failed: ${error.message}`;
        logger.error('Health check database failed', { error: error.message });
        return res.status(500).json({status: 'error', message: 'Internal Server Error', details: healthDetails});
    }
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    healthDetails.memoryUsage.usage = memoryUsage;
    const memoryThreshold = process.env.MEMORY_THRESHOLD || os.totalmem() * 0.8;
    if (memoryUsage.heapUsed > memoryThreshold) {
        healthDetails.memoryUsage.status = 'DEGRADED';
        healthDetails.memoryUsage.message = `Memory usage is high: ${memoryUsage.heapUsed / 1024 / 1024} MB used`;
        return res.status(503).json({status: 'DEGRADED', details: healthDetails});
    } else {
        healthDetails.memoryUsage.status = 'UP';
        healthDetails.memoryUsage.message = 'Memory usage is within acceptable limits';
    }
    
    // Check disk space
    try {
        const diskSpace = await fs.stat(process.env.SPACE_CHECK || '/');
        healthDetails.diskSpace.free = diskSpace.available;
        const diskSpaceThreshold = process.env.DISK_THRESHOLD || 1024 * 1024 * 1024; // 1GB threshold
        if (diskSpace.available < diskSpaceThreshold) {
            healthDetails.diskSpace.status = 'DEGRADED';
            healthDetails.diskSpace.message = `Disk space is low: ${diskSpace.available / 1024 / 1024} MB available`;
            return res.status(503).json({status: 'DEGRADED', details: healthDetails});
        } else {
            healthDetails.diskSpace.status = 'UP';
            healthDetails.diskSpace.message = 'Disk space is sufficient';
        }
    } catch (error) {
        healthDetails.diskSpace.status = 'DOWN';
        healthDetails.diskSpace.message = `Disk space check failed: ${error.message}`;
        logger.error('Disk space check failed', { error: error.message });
        return res.status(500).json({status: 'error', message: 'Disk space check failed', details: healthDetails});
    }
    
    // Check CPU load
    const cpuLoad = os.loadavg()[0]; // 1-minute load average
    healthDetails.cpuLoad.load = cpuLoad;
    if (cpuLoad > (process.env.CPU_LOAD_THRESHOLD || os.cpus().length * 0.8)) {
        healthDetails.cpuLoad.status = 'DEGRADED';
        healthDetails.cpuLoad.message = `CPU load is high: ${cpuLoad}`;
        return res.status(503).json({status: 'DEGRADED', details: healthDetails});
    } else {
        healthDetails.cpuLoad.status = 'UP';
        healthDetails.cpuLoad.message = 'CPU load is within acceptable limits';
    }
    
    // Check network latency
    try {
        const latency = await checkNetworkLatency(process.env.HOST_DNS || '8.8.8.8');
        healthDetails.networkLatency.latency = latency;
        healthDetails.networkLatency.status = latency > (process.env.LATENCY_THRESHOLD || 100) ? 'DEGRADED' : 'UP';
        healthDetails.networkLatency.message = latency > (process.env.LATENCY_THRESHOLD || 100) ? `High network latency: ${latency}ms` : 'Network latency is acceptable';
    } catch (error) {
        healthDetails.networkLatency.status = 'DOWN';
        healthDetails.networkLatency.message = `Network latency check failed: ${error.message}`;
        return res.status(503).json({status: 'DOWN', details: healthDetails});
    }
    
    // Check DNS resolution
    try {
        healthDetails.dnsResolution.addresses = await checkDNSResolution(process.env.HOST_DNS || 'example.com');
        healthDetails.dnsResolution.status = 'UP';
        healthDetails.dnsResolution.message = 'DNS resolution is successful';
    } catch (error) {
        healthDetails.dnsResolution.status = 'DOWN';
        healthDetails.dnsResolution.message = `DNS resolution failed: ${error.message}`;
        logger.error('DNS resolution failed', { error: error.message });
        return res.status(503).json({status: 'DOWN', details: healthDetails});
    }
    
    // Check S3 availability
    try {
        const s3Status = await checkS3Availability(process.env.S3_BUCKET_NAME);
        healthDetails.s3.status = s3Status.status;
        healthDetails.s3.message = s3Status.message;
        if (s3Status.status !== 'UP') {
            return res.status(503).json({ status: 'DEGRADED', details: healthDetails });
        }
    } catch (error) {
        healthDetails.s3.status = 'DOWN';
        healthDetails.s3.message = `S3 availability check failed: ${error.message}`;
        logger.error('S3 availability check failed', { error: error.message });
        return res.status(503).json({status: 'DOWN', details: healthDetails});
    }
    
    // Log health check results
    logger.info('Health check completed', { details: healthDetails });
    
    return res.status(200).json({status: 'UP', details: healthDetails});
});

module.exports = { healthCheck };