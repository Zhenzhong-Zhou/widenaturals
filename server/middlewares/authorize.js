const NodeCache = require('node-cache');

// Create a cache with a default expiration time
const permissionCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        const userId = req.user.id; // Assuming the user ID is attached to req.user after authentication
        const route = req.originalUrl;
        
        try {
            // Check if permissions are cached
            const cacheKey = `${userId}-${route}-${requiredPermission}`;
            const cachedResult = permissionCache.get(cacheKey);
            
            if (cachedResult) {
                if (cachedResult.hasPermission) {
                    return next();
                } else {
                    return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
                }
            }
            
            // Query to check if the user has the required permission, including temporary permissions
            const query = `
        SELECT 1 FROM (
          SELECT rp.permission_id
          FROM employees e
          INNER JOIN role_permissions rp ON e.role_id = rp.role_id
          INNER JOIN route_permissions route_perm ON rp.permission_id = route_perm.permission_id
          WHERE e.id = $1 AND route_perm.route = $2 AND rp.permission_id = (
              SELECT id FROM permissions WHERE name = $3 LIMIT 1
          )
          UNION ALL
          SELECT tp.permission_id
          FROM temporary_permissions tp
          WHERE tp.employee_id = $1 AND tp.status = 'active' AND tp.expires_at > NOW()
          AND tp.permission_id = (
              SELECT id FROM permissions WHERE name = $3 LIMIT 1
          )
        ) as permissions
        LIMIT 1;
      `;
            const values = [userId, route, requiredPermission];
            
            const result = await pool.query(query, values);
            
            const hasPermission = result.rows.length > 0;
            
            // Cache the result for future use
            permissionCache.set(cacheKey, { hasPermission });
            
            if (hasPermission) {
                return next();
            } else {
                // User does not have permission
                return res.status(403).json({ message: 'Forbidden: You do not have access to this resource.' });
            }
        } catch (error) {
            console.error('Error checking authorization:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    };
};

module.exports = authorize;