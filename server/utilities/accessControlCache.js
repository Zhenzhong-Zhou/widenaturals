const NodeCache = require('node-cache');
const { query } = require('../database/database');
const { pathToRegexp } = require('path-to-regexp');

// Create a cache with no default expiration, TTLs will be set dynamically
const permissionCache = new NodeCache({ checkperiod: 120 });

// Function to get the cache duration (TTL) for a specific route
const getTTLForRoute = async (route) => {
    const sql = `
        SELECT cache_duration
        FROM route_permissions
        WHERE route = $1
        LIMIT 1;
    `;
    const values = [route];
    const result = await query(sql, values);
    
    if (result.length > 0) {
        return result[0].cache_duration;
    } else {
        return 600; // Default to 10 minutes if not specified
    }
};

// Function to refresh the cache asynchronously
const refreshCache = async (cacheKey, route, originalRoleID, originalEmployeeID, requiredPermission) => {
    try {
        const hasPermission = await checkPermission(route, originalRoleID, originalEmployeeID, requiredPermission);
        const ttl = await getTTLForRoute(route);
        permissionCache.set(cacheKey, hasPermission, ttl);
    } catch (error) {
        console.error('Error refreshing cache:', error);
    }
};

// Function to fetch and match the stored route against the request path
const findMatchingRoute = async (requestedRoute) => {
    const sql = `
        SELECT route, cache_duration
        FROM route_permissions;
    `;
    const result = await query(sql);
    
    for (const row of result) {
        const storedRoute = row.route;
        const match = pathToRegexp(storedRoute).exec(requestedRoute);
        if (match) {
            return { matchedRoute: storedRoute, cacheDuration: row.cache_duration };
        }
    }
    
    return null;
};

// Function to check if the user has the required permission for the route
const checkPermission = async (route, originalRoleID, originalEmployeeID, requiredPermission) => {
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
    
    return result.length > 0;
};

module.exports = {
    permissionCache,
    getTTLForRoute,
    refreshCache,
    findMatchingRoute,
    checkPermission
};