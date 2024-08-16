const os = require('os');
const fs = require('fs');
const asyncHandler = require("../middlewares/asyncHandler");
const db = require("../database/database");
const logger = require("../utilities/logger");

const healthCheck = asyncHandler(async (req, res) => {
    const healthDetails = {
        database: { status: 'UNKNOWN' },
        memoryUsage: { status: 'UNKNOWN', usage: null },
        diskSpace: { status: 'UNKNOWN', free: null },
        cpuLoad: { status: 'UNKNOWN', load: null },
        uptime: { status: 'UP', value: process.uptime() },
        timestamp: new Date().toISOString(),
    };
    
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
    const memoryThreshold = os.totalmem() * 0.8;
    if (memoryUsage.heapUsed > memoryThreshold) {
        healthDetails.memoryUsage.status = 'DEGRADED';
        return res.status(503).json({status: 'DEGRADED', details: healthDetails});
    } else {
        healthDetails.memoryUsage.status = 'UP';
    }
    
    // Check disk space
    const diskSpace = fs.statSync('/');  // Replace '/' with the appropriate directory
    healthDetails.diskSpace.free = diskSpace.available;
    const diskSpaceThreshold = 1024 * 1024 * 1024; // 1GB threshold
    if (diskSpace.available < diskSpaceThreshold) {
        healthDetails.diskSpace.status = 'DEGRADED';
        return res.status(503).json({status: 'DEGRADED', details: healthDetails});
    } else {
        healthDetails.diskSpace.status = 'UP';
    }
    
    // Check CPU load
    const cpuLoad = os.loadavg()[0]; // 1-minute load average
    healthDetails.cpuLoad.load = cpuLoad;
    if (cpuLoad > os.cpus().length * 0.8) { // 2x the number of CPUs as a threshold
        healthDetails.cpuLoad.status = 'DEGRADED';
        return res.status(503).json({status: 'DEGRADED', details: healthDetails});
    } else {
        healthDetails.cpuLoad.status = 'UP';
    }
    
    return res.status(200).json({status: 'UP', details: healthDetails});
});

module.exports = { healthCheck };