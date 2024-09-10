const {
    permissionCache,
    refreshCache,
    findMatchingRoute,
    checkPermissionsArray
} = require('../../utilities/accessControlCache');
const { logAuditAction } = require("../../utilities/log/auditLogger");
const logger = require("../../utilities/logger");

// Define your base path
const basePath = '/api/v1';

const authorize = (permissionsArray, isSpecificAction = true) => {
    return async (req, res, next) => {
        const originalEmployeeID = req.employee;
        const originalRoleID = req.role;
        const route = req.originalUrl;
        
        try {
            if (!originalEmployeeID || !originalRoleID) {
                await logAuditAction('authorize', 'id_hash_map', 'invalid_id', originalRoleID, originalEmployeeID, {}, {});
                return res.status(403).json({ message: 'Invalid or unauthorized access' });
            }
            
            // Find the matching route using the adjusted route (with base path handled by findMatchingRoute)
            const routeInfo = await findMatchingRoute(route);
            if (!routeInfo) {
                await logAuditAction('authorize', 'routes', 'route_not_found', originalRoleID, originalEmployeeID, {}, {});
                return res.status(404).json({ message: 'Route not found' });
            }
            let { matchedRoute, cacheDuration } = routeInfo;
            
            // Remove the base path from the matchedRoute
            if (matchedRoute.startsWith(basePath)) {
                matchedRoute = matchedRoute.slice(basePath.length);
            }
            
            const cacheKey = `${originalEmployeeID}-${matchedRoute}-${permissionsArray.join('-')}`;
            const cachedResult = permissionCache.get(cacheKey);
            
            if (cachedResult !== undefined) {
                if (cachedResult) {
                    // Refresh cache for short-lived routes
                    if (cacheDuration <= 60) {
                        setImmediate(() => refreshCache(cacheKey, matchedRoute, originalRoleID, originalEmployeeID, permissionsArray, isSpecificAction));
                    }
                    await logAuditAction('authorize', 'routes', 'granted', originalRoleID, originalEmployeeID, {}, {});
                    
                    // Attach permissions to the req object
                    req.permissions = permissionsArray;
                    return next();
                } else {
                    await logAuditAction('authorize', 'routes', 'denied', originalRoleID, originalEmployeeID, {}, {});
                    return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
                }
            }
            
            // Check the permissions array if not cached
            const hasPermission = await checkPermissionsArray(matchedRoute, originalRoleID, originalEmployeeID, permissionsArray, isSpecificAction);
            permissionCache.set(cacheKey, hasPermission, cacheDuration);
            
            if (hasPermission) {
                await logAuditAction('authorize', 'routes', 'granted', originalRoleID, originalEmployeeID, {}, {});
                
                // Attach permissions to the req object
                req.permissions = permissionsArray;
                return next();
            } else {
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