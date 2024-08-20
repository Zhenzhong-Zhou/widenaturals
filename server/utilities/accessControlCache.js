const NodeCache = require('node-cache');
const { pathToRegexp } = require('path-to-regexp');
const { query } = require('../database/database');
const logger = require("../utilities/logger");
const { logAuditAction } = require("../utilities/log/auditLogger");

// Create a cache with no default expiration, TTLs will be set dynamically
const permissionCache = new NodeCache({ checkperiod: 120 });

// Function to get the cache duration (TTL) for a specific route and permission type
const getTTLForPermission = async (route, isSpecificAction) => {
    try {
        const sql = `
            SELECT cache_duration
            FROM route_permissions
            WHERE route = $1
            LIMIT 1;
        `;
        const values = [route];
        const result = await query(sql, values);
        
        if (result.length > 0) {
            return isSpecificAction ? Math.min(result[0].cache_duration, 300) : result[0].cache_duration;
        } else {
            return isSpecificAction ? 300 : 600; // Default to 5 minutes for specific actions, 10 minutes otherwise
        }
    } catch (error) {
        logger.error('Error fetching TTL for permission:', { route, error });
        throw error; // Rethrow error if needed for higher-level handling
    }
};

// Function to refresh the cache asynchronously
const refreshCache = async (cacheKey, route, originalRoleID, originalEmployeeID, permissionsArray, isSpecificAction) => {
    try {
        const hasPermission = await checkPermissionsArray(route, originalRoleID, originalEmployeeID, permissionsArray, isSpecificAction);
        const ttl = await getTTLForPermission(route, isSpecificAction);
        permissionCache.set(cacheKey, hasPermission, ttl);
        
        // Audit log for cache refresh
        await logAuditAction('refreshCache', 'permissions', 'cache_refresh', originalRoleID, originalEmployeeID, {}, { cacheKey, hasPermission, ttl });
    } catch (error) {
        logger.error('Error refreshing cache:', { cacheKey, route, error });
        await logAuditAction('refreshCache', 'permissions', 'cache_refresh_error', originalRoleID, originalEmployeeID, {}, { error: error.message });
    }
};

// Function to fetch and match the stored route against the request path
const findMatchingRoute = async (requestedRoute) => {
    try {
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
    } catch (error) {
        logger.error('Error finding matching route:', { requestedRoute, error });
        throw error; // Rethrow error for higher-level handling if necessary
    }
};

// Function to check if the user has the required permission for the route
const checkPermissionsArray = async (route, originalRoleID, originalEmployeeID, permissionsArray, isSpecificAction) => {
    try {
        const sql = `
            SELECT 1
            FROM (
                SELECT rp.permission_id
                FROM role_permissions rp
                INNER JOIN route_permissions route_perm ON rp.permission_id = route_perm.permission_id
                WHERE rp.role_id = $2 AND route_perm.route = $1
                AND rp.permission_id IN (
                    SELECT id FROM permissions WHERE name = ANY($3::text[])
                )
                UNION ALL
                SELECT tp.permission_id
                FROM temporary_permissions tp
                WHERE tp.employee_id = $4 AND tp.status = 'active' AND tp.expires_at > NOW()
                AND tp.permission_id IN (
                    SELECT id FROM permissions WHERE name = ANY($3::text[])
                )
            ) AS combined_permissions
            LIMIT 1;
        `;
        const values = [route, originalRoleID, permissionsArray, originalEmployeeID];
        const result = await query(sql, values);
        
        if (result.length > 0) {
            // Audit log for permission check
            await logAuditAction('checkPermission', 'permissions', 'permission_granted', originalRoleID, originalEmployeeID, {}, { permissionsArray, isSpecificAction });
            return true;
        } else {
            // Audit log for permission denied
            await logAuditAction('checkPermission', 'permissions', 'permission_denied', originalRoleID, originalEmployeeID, {}, { permissionsArray, isSpecificAction });
            return false;
        }
    } catch (error) {
        logger.error('Error checking permissions array:', { route, originalRoleID, originalEmployeeID, permissionsArray, error });
        await logAuditAction('checkPermission', 'permissions', 'permission_check_error', originalRoleID, originalEmployeeID, {}, { error: error.message });
        throw error; // Rethrow for higher-level error handling
    }
};

module.exports = {
    permissionCache,
    getTTLForPermission,
    refreshCache,
    findMatchingRoute,
    checkPermissionsArray
};