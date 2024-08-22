exports.seed = async function(knex) {
    try {
        // Insert new roles
        await knex('roles').insert([
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'admin',
                description: 'Administrator - Full access to all system resources, including user management, system settings, and critical operations. Responsible for overseeing and managing the entire application.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'account_manager',
                description: 'Account Manager - Manages customer accounts and related administrative tasks.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'sales',
                description: 'Handles sales-related tasks.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'inventory_manager',
                description: 'Inventory Manager - Oversees inventory and stock management.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'accountant',
                description: 'Manages financial records and transactions.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'hr_manager',
                description: 'HR Manager - Handles HR-related tasks, including employee management and role assignments (excluding admin).'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'marketing',
                description: 'Manages marketing campaigns and customer outreach.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'general_staff',
                description: 'Basic access for all employees.'
            }
        ])
        .onConflict('name')
        .ignore(); // Avoid inserting duplicate roles
        
        // Insert permissions
        await knex('permissions').insert([
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'view_employee_overview',
                description: 'Allows viewing of basic employee information such as name, email, and phone number.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'view_profile',
                description: 'Allows viewing of employee profile information.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'edit_profile',
                description: 'Allows editing of employee profile information.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'upload_profile_image',
                description: 'Allows uploading or updating of the employee profile image.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'view_self_service_options',
                description: 'Allows viewing of self-service options related to their profile or employment details.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'view_sales_data',
                description: 'Allows viewing of sales data.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'manage_sales',
                description: 'Allows managing of sales processes.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'view_inventory',
                description: 'Allows viewing of inventory details.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'manage_inventory',
                description: 'Allows managing of inventory and stock.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'view_financial_data',
                description: 'Allows viewing of financial records.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'manage_finances',
                description: 'Allows managing of financial transactions.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'view_hr_data',
                description: 'Allows viewing of HR-related information.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'manage_hr',
                description: 'Allows managing of HR-related tasks, including employee creation and role assignment (excluding admin).'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'create_roles',
                description: 'Allows the creation of non-admin roles.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'admin_access',
                description: 'Grants full access to all system resources, including all other permissions.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'view_health_status',
                description: 'Allows viewing of system health status.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'manage_employees',
                description: 'Allows managing of employee records and related HR tasks.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'manage_managers',
                description: 'Allows managing of manager-related tasks.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'view_full_login_history',
                description: 'Allows viewing of all authentication logs, including all users’ login histories.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'view_employee_records',
                description: 'Allows viewing detailed employee records.'
            }
        ])
        .onConflict('name')
        .ignore(); // Avoid inserting duplicate permissions
        
        // Utility function to get a role ID by name
        const getRoleId = (roles, roleName) => {
            const role = roles.find(role => role.name === roleName);
            if (!role) throw new Error(`${roleName} role not found.`);
            return role.id;
        };

        // Utility function to get permission ID by name
        const getPermissionId = (permissions, permissionName) => {
            const permission = permissions.find(permission => permission.name === permissionName);
            if (!permission) throw new Error(`${permissionName} permission not found.`);
            return permission.id;
        };
        
        const rolePermissionMappings = {
            hr_manager: [
                'view_hr_data',
                'manage_hr',
                'create_roles',
                'view_full_login_history',
                'manage_employees'
            ],
            general_staff: [
                'view_employee_overview',
                'view_profile',
                'edit_profile',
                'upload_profile_image'
            ],
            sales: [
                'view_sales_data',
                'manage_sales'
            ],
            inventory_manager: [
                'view_inventory',
                'manage_inventory'
            ],
            accountant: [
                'view_financial_data',
                'manage_finances'
            ],
            marketing: [
                'view_sales_data'
            ],
            account_manager: [
                'view_profile',
                'edit_profile',
                'manage_sales',
                'view_financial_data'
            ],
            admin: 'all' // Admin gets all permissions
        };
        
        const roles = await knex('roles')
            .whereIn('name', Object.keys(rolePermissionMappings))
            .select('id', 'name');
        
        if (!roles.length) {
            throw new Error('No roles found. Please check the role insertion.');
        }
        
        const permissions = await knex('permissions')
            .whereIn('name', [
                'view_profile',
                'view_employee_overview',
                'edit_profile',
                'upload_profile_image',
                'view_self_service_options',
                'view_sales_data',
                'manage_sales',
                'view_inventory',
                'manage_inventory',
                'view_financial_data',
                'manage_finances',
                'view_hr_data',
                'manage_hr',
                'create_roles',
                'admin_access',
                'view_health_status',
                'manage_employees',
                'manage_managers',
                'view_full_login_history',
                'view_employee_records'
            ])
            .select('id', 'name');
        
        if (!permissions.length) {
            throw new Error('No permissions found. Please check the permissions insertion.');
        }
        
        const rolePermissions = [];
        
        roles.forEach(role => {
            const permissionNames = rolePermissionMappings[role.name];
            
            if (permissionNames === 'all') {
                // Admin role gets all permissions
                permissions.forEach(permission => {
                    rolePermissions.push({ role_id: role.id, permission_id: permission.id });
                });
            } else {
                permissionNames.forEach(permissionName => {
                    const permissionId = getPermissionId(permissions, permissionName);
                    rolePermissions.push({ role_id: role.id, permission_id: permissionId });
                });
            }
        });

        // Insert role-permission assignments into role_permissions table
        await knex('role_permissions').insert(rolePermissions)
            .onConflict(['role_id', 'permission_id'])  // Avoid inserting duplicates
            .ignore();  // If a conflict occurs, do nothing
        
    } catch (error) {
        console.error('Error seeding roles and permissions:', error.message);
        throw error;
    }
};