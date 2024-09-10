const { match } = require('path-to-regexp');
const fetchRoutesWithBasePath = require("./routeUtils");
const logger = require('./logger');

const getServiceName = async (url) => {
    try {
        const routes = await fetchRoutesWithBasePath();
        
        for (const { route, service, cacheDuration } of routes) {
            try {
                // Create the match pattern and check if it matches the requested URL
                const matchPattern = match(route, { decode: decodeURIComponent });
                const result = matchPattern(url);
                
                if (result) {
                    // Return matched route, service, and cacheDuration (set default if not available)
                    return { route, service, cacheDuration: cacheDuration || 600 }; // Default to 600 seconds if not provided
                }
            } catch (matchError) {
                logger.error(`Error in pattern matching: ${route}`, matchError);
                // Log and continue to the next route match attempt
            }
        }
        
        // Default service if no match is found
        return { service: 'system_service', cacheDuration: 600 };
        
    } catch (error) {
        logger.error('Error fetching routes or matching the URL:', error);
        throw new Error('Unable to determine service name due to an internal error.');
    }
};

module.exports = getServiceName;