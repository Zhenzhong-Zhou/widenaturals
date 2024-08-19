const { permissionCache, refreshCache, findMatchingRoute, checkPermission} = require('../utilities/accessControlCache');
const { getIDFromMap } = require("../utilities/idUtils");

const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        const hashedEmployeeID = req.employee.sub;
        const hashedRoleID = req.employee.role;
        const route = req.originalUrl;
        console.log(req.employee);
        console.log(req.originalUrl);
        
        try {
            const [originalEmployeeID, originalRoleID] = await Promise.all([
                getIDFromMap(hashedEmployeeID, 'employees'),
                getIDFromMap(hashedRoleID, 'roles')
            ]);
            
            const routeInfo = await findMatchingRoute(route);
            if (!routeInfo) {
                return res.status(404).json({ message: 'Route not found' });
            }
            const { matchedRoute, cacheDuration } = routeInfo;
            
            const cacheKey = `${originalEmployeeID}-${matchedRoute}-${requiredPermission}`;
            const cachedResult = permissionCache.get(cacheKey);
            
            if (cachedResult !== undefined) {
                if (cachedResult) {
                    if (cacheDuration <= 60) {
                        setImmediate(() => refreshCache(cacheKey, matchedRoute, originalRoleID, originalEmployeeID, requiredPermission));
                    }
                    return next();
                } else {
                    return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
                }
            }
            
            const hasPermission = await checkPermission(matchedRoute, originalRoleID, originalEmployeeID, requiredPermission);
            permissionCache.set(cacheKey, hasPermission, cacheDuration);
            
            if (hasPermission) {
                return next();
            } else {
                return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
            }
        } catch (error) {
            console.error('Error checking authorization:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
};

module.exports = authorize;