exports.seed = async function(knex) {
    // Permissions mapped to routes
    const routePermissions = [
        {
            route: '/auth',
            permission: 'view_profile', // Basic access for login, logout, reset, and forgot password
            cache_duration: 60 // 1 minute
        },
        {
            route: '/status',
            permission: 'view_health_status', // Health check, restricted to admins
            cache_duration: 120 // 2 minutes
        },
        {
            route: '/admin',
            permission: 'admin_access', // Full access to admin-related routes
            cache_duration: 30 // 30 seconds
        },
        {
            route: '/managers',
            permission: 'manage_managers', // Specific to manager management
            cache_duration: 60 // 1 minute
        },
        {
            route: '/employees',
            permission: 'manage_employees' // HR and specific roles managing employees
        },
        {
            route: '/logs/system-monitoring',
            permission: 'admin_access', // Only admins access system monitoring logs
            cache_duration: 120 // 2 minutes
        },
        {
            route: '/logs/auth-monitoring',
            permission: 'view_auth_logs', // Managers and HR can access authentication logs
            cache_duration: 300 // 5 minutes
        },
        // {
        //     route: '/logs/token-logs',
        //     permission: 'admin_access' // Only admins access token logs
        // },
        // {
        //     route: '/logs/session-logs',
        //     permission: 'admin_access' // Only admins access session logs
        // },
        // {
        //     route: '/tokens',
        //     permission: 'admin_access' // Only admins manage tokens
        // },
        // {
        //     route: '/sessions',
        //     permission: 'admin_access' // Only admins manage sessions
        // }
    ];
    
    // Insert the permissions into the route_permissions table
    for (const rp of routePermissions) {
        const permissionId = await knex('permissions')
            .where({ name: rp.permission })
            .select('id')
            .first();
        
        if (permissionId) {
            await knex('route_permissions')
                .insert({
                    id: knex.raw('uuid_generate_v4()'),
                    route: rp.route,
                    permission_id: permissionId.id,
                    cache_duration: rp.cache_duration,
                    created_at: knex.fn.now(),
                    updated_at: knex.fn.now()
                })
                .onConflict(['route', 'permission_id']) // Specify columns to check for conflict
                .ignore(); // Ignore the insert if a conflict occurs
        }
    }
};