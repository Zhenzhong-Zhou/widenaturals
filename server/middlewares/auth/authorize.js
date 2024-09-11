const {
    permissionCache,
    refreshCache,
    findMatchingRoute,
    checkPermissionsArray
} = require('../../utilities/accessControlCache');
const { logAuditAction } = require("../../utilities/log/auditLogger");
const logger = require("../../utilities/logger");
const {errorHandler} = require("../error/errorHandler");

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
                errorHandler(403, 'Invalid or unauthorized access');
            }
            
            // Find the matching route using the adjusted route (with base path handled by findMatchingRoute)
            const routeInfo = await findMatchingRoute(route);
            if (!routeInfo) {
                await logAuditAction('authorize', 'routes', 'route_not_found', originalRoleID, originalEmployeeID, {}, {});
                errorHandler(404, 'Route not found');
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
                    errorHandler(403, 'Forbidden: You do not have access to this resource.');
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
                errorHandler(403, 'Forbidden: You do not have access to this resource.');
            }
        } catch (error) {
            logger.error('Error checking authorization:', { error });
            next(error);
        }
    };
};

module.exports = authorize;