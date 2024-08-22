const { pathToRegexp } = require('path-to-regexp');
const { permissionCache, refreshCache, findMatchingRoute, checkPermissionsArray} = require('../../utilities/accessControlCache');
const { getIDFromMap } = require("../../utilities/idUtils");
const { logAuditAction } = require("../../utilities/log/auditLogger");
const logger = require("../../utilities/logger");

// Define your base path
const basePath = '/api/v1';

const authorize = (permissionsArray, isSpecificAction = true) => {
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
                await logAuditAction('authorize', 'routes', 'route_not_found', originalRoleID, originalEmployeeID, {}, {});
                return res.status(404).json({ message: 'Route not found' });
            }
            const { matchedRoute, cacheDuration } = routeInfo;
            
            // Match the adjusted route with the stored route
            const match = pathToRegexp(matchedRoute).exec(adjustedRoute);
            if (!match) {
                await logAuditAction('authorize', 'routes', 'denied', originalRoleID, originalEmployeeID, {}, {});
                return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
            }
            
            const cacheKey = `${originalEmployeeID}-${matchedRoute}-${permissionsArray.join('-')}`;
            const cachedResult = permissionCache.get(cacheKey);
            
            if (cachedResult !== undefined) {
                if (cachedResult) {
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
            
            // Check the permissions array
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