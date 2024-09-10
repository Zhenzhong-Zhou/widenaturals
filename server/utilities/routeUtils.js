const { query } = require('../database/database');
const logger = require('./logger');

// Define the base path
const basePath = '/api/v1';

// Function to fetch routes and combine with basePath
const fetchRoutesWithBasePath = async () => {
    try {
        const sql = `
            SELECT route, service, cache_duration
            FROM route_permissions;
        `;
        
        // Fetch routes from the database
        const result = await query(sql);
        
        // Adjust routes by prepending the base path and handling wildcards
        return result.map(row => {
            let storedRoute = `${basePath}${row.route}`;
            
            return {
                route: storedRoute,
                service: row.service,  // Return the service name as well
                cacheDuration: row.cache_duration
            };
        });
    } catch (error) {
        logger.error('Error fetching routes from the database:', error);
        throw error;
    }
};

module.exports = fetchRoutesWithBasePath;