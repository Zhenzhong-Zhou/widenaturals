const { pathToRegexp } = require('path-to-regexp');
const { permissionCache, refreshCache, findMatchingRoute, checkPermission } = require('../utilities/accessControlCache');
const { getIDFromMap } = require("../utilities/idUtils");
const { logAuditAction } = require("../utilities/log/auditLogger");
const logger = require("../utilities/logger");

// Define your base path
const basePath = '/api/v1';

const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        const hashedEmployeeID = req.employee.sub;
        const hashedRoleID = req.employee.role;
        const route = req.originalUrl;
        
        // Strip the base path from the requested route
        const adjustedRoute = route.startsWith(basePath) ? route.slice(basePath.length) : route;
        
        try {
            // Retrieve original IDs from the hashed values
            const [originalEmployeeID, originalRoleID] = await Promise.all([
                getIDFromMap(hashedEmployeeID, 'employees'),
                getIDFromMap(hashedRoleID, 'roles')
            ]);
            
            // Find the matching route in the database
            const routeInfo = await findMatchingRoute(adjustedRoute);
            if (!routeInfo) {
                // Audit log for route not found
                await logAuditAction('authorize', 'routes', 'route_not_found', originalRoleID, originalEmployeeID, {}, {});
                return res.status(404).json({ message: 'Route not found' });
            }
            const { matchedRoute, cacheDuration } = routeInfo;
            
            // Match the adjusted route with the stored route (which might include wildcards or dynamic segments)
            const match = pathToRegexp(matchedRoute).exec(adjustedRoute);
            
            if (!match) {
                // Audit log for access denied due to no match
                await logAuditAction('authorize', 'routes', 'denied', originalRoleID, originalEmployeeID, {}, {});
                return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
            }
            
            const cacheKey = `${originalEmployeeID}-${matchedRoute}-${requiredPermission}`;
            const cachedResult = permissionCache.get(cacheKey);
            
            if (cachedResult !== undefined) {
                if (cachedResult) {
                    // Optionally refresh the cache if the duration is short
                    if (cacheDuration <= 60) {
                        setImmediate(() => refreshCache(cacheKey, matchedRoute, originalRoleID, originalEmployeeID, requiredPermission));
                    }
                    // Audit log for successful authorization from cache
                    await logAuditAction('authorize', 'routes', 'granted', originalRoleID, originalEmployeeID, {}, {});
                    return next();
                } else {
                    // Audit log for access denied from cache
                    await logAuditAction('authorize', 'routes', 'denied', originalRoleID, originalEmployeeID, {}, {});
                    return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
                }
            }
            
            // Check permission if no cache result is found
            const hasPermission = await checkPermission(matchedRoute, originalRoleID, originalEmployeeID, requiredPermission);
            permissionCache.set(cacheKey, hasPermission, cacheDuration);
            
            if (hasPermission) {
                // Audit log for successful authorization
                await logAuditAction('authorize', 'routes', 'granted', originalRoleID, originalEmployeeID, {}, {});
                return next();
            } else {
                // Audit log for denied authorization
                await logAuditAction('authorize', 'routes', 'denied', originalRoleID, originalEmployeeID, {}, {});
                return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
            }
        } catch (error) {
            logger.error('Error checking authorization:', { error });
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
};

module.exports = authorize;