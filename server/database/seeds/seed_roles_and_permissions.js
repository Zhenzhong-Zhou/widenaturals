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
                    name: 'view_profile',
                    description: 'Allows viewing of user profile information.'
                },
                {
                    id: knex.raw('uuid_generate_v4()'),
                    name: 'edit_profile',
                    description: 'Allows editing of user profile information.'
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
        
        // Fetch role IDs for later use
        const roles = await knex('roles')
            .whereIn('name', [
                'general_staff',
                'sales',
                'inventory_manager',
                'accountant',
                'hr_manager',
                'marketing',
                'account_manager',
                'admin'
            ])
            .select('id', 'name');
        
        if (!roles.length) {
            throw new Error('No roles found. Please check the role insertion.');
        }
        
        const permissions = await knex('permissions')
            .whereIn('name', [
                'view_profile',
                'edit_profile',
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
        
        // Assign HR Manager Permissions
        const hrManagerRoleId = roles.find(role => role.name === 'hr_manager')?.id;
        if (!hrManagerRoleId) throw new Error('HR Manager role not found.');
        rolePermissions.push(
            { role_id: hrManagerRoleId, permission_id: permissions.find(permission => permission.name === 'view_hr_data')?.id },
            { role_id: hrManagerRoleId, permission_id: permissions.find(permission => permission.name === 'manage_hr')?.id },
            { role_id: hrManagerRoleId, permission_id: permissions.find(permission => permission.name === 'create_roles')?.id },
            { role_id: hrManagerRoleId, permission_id: permissions.find(permission => permission.name === 'view_full_login_history')?.id }, // Allow HR Manager to view full login history
            { role_id: hrManagerRoleId, permission_id: permissions.find(permission => permission.name === 'manage_employees')?.id } // Allow HR Manager to manage employees
        );
        
        // Assign General Staff Permissions
        const generalStaffRoleId = roles.find(role => role.name === 'general_staff')?.id;
        if (!generalStaffRoleId) throw new Error('General Staff role not found.');
        rolePermissions.push(
            { role_id: generalStaffRoleId, permission_id: permissions.find(permission => permission.name === 'view_profile')?.id },
            { role_id: generalStaffRoleId, permission_id: permissions.find(permission => permission.name === 'edit_profile')?.id }
        );
        
        // Assign Sales Permissions
        const salesRoleId = roles.find(role => role.name === 'sales')?.id;
        if (!salesRoleId) throw new Error('Sales role not found.');
        rolePermissions.push(
            { role_id: salesRoleId, permission_id: permissions.find(permission => permission.name === 'view_sales_data')?.id },
            { role_id: salesRoleId, permission_id: permissions.find(permission => permission.name === 'manage_sales')?.id }
        );
        
        // Assign Inventory Manager Permissions
        const inventoryManagerRoleId = roles.find(role => role.name === 'inventory_manager')?.id;
        if (!inventoryManagerRoleId) throw new Error('Inventory Manager role not found.');
        rolePermissions.push(
            { role_id: inventoryManagerRoleId, permission_id: permissions.find(permission => permission.name === 'view_inventory')?.id },
            { role_id: inventoryManagerRoleId, permission_id: permissions.find(permission => permission.name === 'manage_inventory')?.id }
        );
        
        // Assign Accountant Permissions
        const accountantRoleId = roles.find(role => role.name === 'accountant')?.id;
        if (!accountantRoleId) throw new Error('Accountant role not found.');
        rolePermissions.push(
            { role_id: accountantRoleId, permission_id: permissions.find(permission => permission.name === 'view_financial_data')?.id },
            { role_id: accountantRoleId, permission_id: permissions.find(permission => permission.name === 'manage_finances')?.id }
        );
        
        // Assign Marketing Permissions
        const marketingRoleId = roles.find(role => role.name === 'marketing')?.id;
        if (!marketingRoleId) throw new Error('Marketing role not found.');
        rolePermissions.push(
            { role_id: marketingRoleId, permission_id: permissions.find(permission => permission.name === 'view_sales_data')?.id }
        );
        
        // Assign Account Manager Permissions
        const accountManagerRoleId = roles.find(role => role.name === 'account_manager')?.id;
        if (!accountManagerRoleId) throw new Error('Account Manager role not found.');
        rolePermissions.push(
            { role_id: accountManagerRoleId, permission_id: permissions.find(permission => permission.name === 'view_profile')?.id },
            { role_id: accountManagerRoleId, permission_id: permissions.find(permission => permission.name === 'edit_profile')?.id },
            { role_id: accountManagerRoleId, permission_id: permissions.find(permission => permission.name === 'manage_sales')?.id },
            { role_id: accountManagerRoleId, permission_id: permissions.find(permission => permission.name === 'view_financial_data')?.id }
        );
        
        // Assign Admin Permissions (Assign all permissions to admin)
        const adminRoleId = roles.find(role => role.name === 'admin')?.id;
        if (!adminRoleId) throw new Error('Admin role not found.');
        permissions.forEach(permission => {
            rolePermissions.push({ role_id: adminRoleId, permission_id: permission.id });
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