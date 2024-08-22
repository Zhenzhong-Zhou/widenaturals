exports.seed = async function(knex) {
    // Permissions mapped to routes
    const routePermissions = [
        {
            route: '/auth*',
            permission: 'view_profile', // Basic access for login, logout, reset, and forgot password
            cache_duration: 60 // 1 minute
        },
        {
            route: '/status',
            permission: 'view_health_status', // Health check, restricted to admins
            cache_duration: 120 // 2 minutes
        },
        {
            route: '/admin*',
            permission: 'admin_access', // Full access to admin-related routes
            cache_duration: 30 // 30 seconds
        },
        {
            route: '/hr*',
            permission: 'manage_employees', // HR and specific roles managing employees
            cache_duration: 60 // 1 minute
        },
        {
            route: '/hr/employees/update/:id',
            permission: 'manage_employees', // HR and specific roles managing employees
            cache_duration: 60 // 1 minute
        },
        {
            route: '/hr/employees/view/:id',
            permission: 'view_employee_records', // HR and specific roles managing employees
            cache_duration: 60 // 1 minute
        },
        {
            route: "/employees/overview",
            permission: "view_employee_overview"
        },
        {
            route: "/employees/me",
            permission: "upload_profile_image"
        },
        {
            route: '/employees/self-service/:id',
            permission: 'view_self_service_options_id'
        },
        {
            route: '/logs/system-monitoring*',
            permission: 'admin_access', // Only admins access system monitoring logs
            cache_duration: 120 // 2 minutes
        },
        {
            route: '/logs/auth-monitoring*',
            permission: 'view_auth_logs', // Managers and HR can access authentication logs
            cache_duration: 300 // 5 minutes
        }
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
    
    // Fetch all permissions once and store them in a dictionary
    const permissions = await knex('permissions')
        .select('id', 'name');
    
    const permissionMap = permissions.reduce((acc, permission) => {
        acc[permission.name] = permission.id;
        return acc;
    }, {});
    
    // Insert the permissions into the route_permissions table
    for (const rp of routePermissions) {
        const permissionId = permissionMap[rp.permission];
        
        if (permissionId) {
            await knex('route_permissions')
                .insert({
                    id: knex.raw('uuid_generate_v4()'),
                    route: rp.route,
                    permission_id: permissionId,
                    cache_duration: rp.cache_duration || 600, // Default to 10 minutes
                    created_at: knex.fn.now(),
                    updated_at: knex.fn.now()
                })
                .onConflict(['route', 'permission_id']) // Specify columns to check for conflict
                .ignore(); // Ignore the insert if a conflict occurs
        }
    }
};