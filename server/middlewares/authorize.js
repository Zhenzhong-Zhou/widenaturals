const NodeCache = require('node-cache');
const { query } = require('../database/database');
const { getIDFromMap } = require("../utilities/idUtils");

// Create a cache with a default expiration time
const permissionCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        const hashedEmployeeID = req.employee.sub;
        const hashedRoleID = req.employee.role; // Assuming role ID is in the token as 'role'
        const route = req.originalUrl;
        
        try {
            // Retrieve original Employee ID and Role ID from the hashed values
            const [originalEmployeeID, originalRoleID] = await Promise.all([
                getIDFromMap(hashedEmployeeID, 'employees'),
                getIDFromMap(hashedRoleID, 'roles')
            ]);
            
            // Check if permissions are cached
            const cacheKey = `${originalEmployeeID}-${route}-${requiredPermission}`;
            const cachedResult = permissionCache.get(cacheKey);
            
            if (cachedResult !== undefined) {
                // Use the cached result
                if (cachedResult) {
                    return next();
                } else {
                    return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
                }
            }
            
            // Single query to check if the user has the required permission, including both role-based and temporary permissions
            const sql = `
                SELECT 1
                FROM (
                    SELECT rp.permission_id
                    FROM role_permissions rp
                    INNER JOIN route_permissions route_perm ON rp.permission_id = route_perm.permission_id
                    WHERE rp.role_id = $2 AND route_perm.route = $1
                    AND rp.permission_id = (
                        SELECT id FROM permissions WHERE name = $3 LIMIT 1
                    )
                    UNION ALL
                    SELECT tp.permission_id
                    FROM temporary_permissions tp
                    WHERE tp.employee_id = $4 AND tp.status = 'active' AND tp.expires_at > NOW()
                    AND tp.permission_id = (
                        SELECT id FROM permissions WHERE name = $3 LIMIT 1
                    )
                ) AS combined_permissions
                LIMIT 1;
            `;
            const values = [route, originalRoleID, requiredPermission, originalEmployeeID];
            const result = await query(sql, values);
            
            const hasPermission = result.rows.length > 0;
            
            // Cache the result for future use
            permissionCache.set(cacheKey, hasPermission);
            
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