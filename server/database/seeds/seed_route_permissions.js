exports.seed = async function (knex) {
    // Permissions mapped to routes
    const routePermissions = [
        {
            route: '/welcome',
            service: 'welcome_page',
            permission: null, // No permission required for the welcome route
        },
        {
            route: '/auth*splat',
            service: 'auth_management', // No permission required for basic auth routes
            permission: null,
            cache_duration: 60 // 1 minute
        },
        {
            route: '/status',
            service: 'health_check_service',
            permission: 'view_health_status', // Health check, restricted to admins
            cache_duration: 120 // 2 minutes
        },
        {
            route: '/admin*splat',
            service: 'admin_panel',
            permission: 'admin_access', // Full access to admin-related routes
            cache_duration: 30 // 30 seconds
        },
        {
            route: '/hr*splat',
            service: 'hr_management',
            permission: 'manage_employees', // HR and specific roles managing employees
            cache_duration: 60 // 1 minute
        },
        {
            route: '/hr/employees*splat',
            service: 'hr_management',
            permission: 'manage_employees', // HR and specific roles managing employees
            cache_duration: 60 // 1 minute
        },
        {
            route: '/hr/employees/view*splat',
            service: 'hr_management',
            permission: 'view_employee_records', // HR and specific roles managing employees
            cache_duration: 60 // 1 minute
        },
        {
            route: "/employees/overview",
            service: 'employee_service',
            permission: "view_employee_overview"
        },
        {
            route: "/employees/me/profile",
            service: 'employee_service',
            permission: "view_profile"
        },
        {
            route: "/employees/me/profile/image",
            service: 'employee_service',
            permission: "upload_profile_image"
        },
        {
            route: '/employees/self-service*splat',
            service: 'employee_service',
            permission: 'view_self_service_options_id'
        },
        {
            route: '/logs/system-monitoring*splat',
            service: 'log_monitoring',
            permission: 'admin_access', // Only admins access system monitoring logs
            cache_duration: 120 // 2 minutes
        },
        {
            route: '/logs/auth-monitoring*splat',
            service: 'log_monitoring',
            permission: 'view_auth_logs', // Managers and HR can access authentication logs
            cache_duration: 300 // 5 minutes
        },
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
                    service: rp.service, // Include the service field here
                    permission_id: permissionId || null, // Handle null permissions
                    cache_duration: rp.cache_duration || 600, // Default to 10 minutes
                    created_at: knex.fn.now(),
                    updated_at: knex.fn.now()
                })
                .onConflict(['route', 'permission_id']) // Specify columns to check for conflict
                .ignore(); // Ignore the insert if a conflict occurs
        }
    }
};