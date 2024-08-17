const os = require('os');
const fs = require('fs').promises;
const dns = require('dns').promises;
const { exec } = require('child_process');
const { HeadBucketCommand } = require('@aws-sdk/client-s3');
const asyncHandler = require("../middlewares/asyncHandler");
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
        return 'UP';
    } catch (error) {
        return 'DOWN';
    }
};

// Health check function
const healthCheck = asyncHandler(async (req, res) => {
    const healthDetails = {
        database: { status: 'UNKNOWN' },
        memoryUsage: { status: 'UNKNOWN', usage: null },
        diskSpace: { status: 'UNKNOWN', free: null },
        cpuLoad: { status: 'UNKNOWN', load: null },
        networkLatency: { status: 'UNKNOWN', latency: null },
        dnsResolution: { status: 'UNKNOWN', addresses: null },
        s3: { status: 'UNKNOWN' },
        uptime: { status: 'UP', value: process.uptime() },
        timestamp: new Date().toISOString(),
    };
    
    // Check database health
    try {
        const healthStatus = await db.checkHealth();
        healthDetails.database.status = healthStatus.status;
        healthDetails.database.message = healthStatus.message || 'Database is healthy';
        
        if (healthStatus.status !== 'UP') {
            return res.status(503).json({status: 'DOWN', details: healthDetails});
        }
    } catch (error) {
        healthDetails.database.status = 'DOWN';
        logger.error('Health check database failed', { error: error.message });
        return res.status(500).json({status: 'error', message: 'Internal Server Error', details: healthDetails});
    }
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    healthDetails.memoryUsage.usage = memoryUsage;
    const memoryThreshold = process.env.MEMORY_THRESHOLD || os.totalmem() * 0.8;
    if (memoryUsage.heapUsed > memoryThreshold) {
        healthDetails.memoryUsage.status = 'DEGRADED';
        return res.status(503).json({status: 'DEGRADED', details: healthDetails});
    } else {
        healthDetails.memoryUsage.status = 'UP';
    }
    
    // Check disk space
    try {
        const diskSpace = await fs.stat(process.env.SPACE_CHECK || '/');
        healthDetails.diskSpace.free = diskSpace.available;
        const diskSpaceThreshold = process.env.DISK_THRESHOLD || 1024 * 1024 * 1024; // 1GB threshold
        if (diskSpace.available < diskSpaceThreshold) {
            healthDetails.diskSpace.status = 'DEGRADED';
            return res.status(503).json({status: 'DEGRADED', details: healthDetails});
        } else {
            healthDetails.diskSpace.status = 'UP';
        }
    } catch (error) {
        healthDetails.diskSpace.status = 'DOWN';
        logger.error('Disk space check failed', { error: error.message });
        return res.status(500).json({status: 'error', message: 'Disk space check failed', details: healthDetails});
    }
    
    // Check CPU load
    const cpuLoad = os.loadavg()[0]; // 1-minute load average
    healthDetails.cpuLoad.load = cpuLoad;
    if (cpuLoad > (process.env.CPU_LOAD_THRESHOLD || os.cpus().length * 0.8)) {
        healthDetails.cpuLoad.status = 'DEGRADED';
        return res.status(503).json({status: 'DEGRADED', details: healthDetails});
    } else {
        healthDetails.cpuLoad.status = 'UP';
    }
    
    // Check network latency
    try {
        const latency = await checkNetworkLatency(process.env.HOST_DNS || '8.8.8.8');
        healthDetails.networkLatency.latency = latency;
        healthDetails.networkLatency.status = latency > (process.env.LATENCY_THRESHOLD || 100) ? 'DEGRADED' : 'UP';
    } catch (error) {
        healthDetails.networkLatency.status = 'DOWN';
        healthDetails.networkLatency.message = error.message;
        return res.status(503).json({status: 'DOWN', details: healthDetails});
    }
    
    // Check DNS resolution
    try {
        healthDetails.dnsResolution.addresses = await checkDNSResolution(process.env.HOST_DNS);
        healthDetails.dnsResolution.status = 'UP';
    } catch (error) {
        healthDetails.dnsResolution.status = 'DOWN';
        logger.error('DNS resolution failed', { error: error.message });
        return res.status(503).json({status: 'DOWN', details: healthDetails});
    }
    
    // Check S3 availability
    try {
        const s3Status = await checkS3Availability(process.env.S3_BUCKET_NAME);
        healthDetails.s3.status = s3Status;
        if (s3Status !== 'UP') {
            return res.status(503).json({ status: 'DEGRADED', details: healthDetails });
        }
    } catch (error) {
        healthDetails.s3.status = 'DOWN';
        logger.error('S3 availability check failed', { error: error.message });
        return res.status(503).json({status: 'DOWN', details: healthDetails});
    }
    
    // Log health check results
    logger.info('Health check completed', { details: healthDetails });
    
    return res.status(200).json({status: 'UP', details: healthDetails});
});

module.exports = { healthCheck };