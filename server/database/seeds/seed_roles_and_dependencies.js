exports.seed = async function (knex) {
    // Fetch all role IDs
    // const roleIdsToDelete = await knex('roles').pluck('id');
    
    // Fetch employee IDs associated with these roles
    // const employeeIds = await knex('employees').whereIn('role_id', roleIdsToDelete).pluck('id');
    
    // Soft delete employees by updating the `deleted_at` column
    // await knex('employees').whereIn('id', employeeIds).update({ deleted_at: knex.fn.now() });
    
    // Optionally delete related records, if applicable:
    
    // Delete related audit logs for these employees
    // await knex('audit_logs').whereIn('employee_id', employeeIds).del();
    
    // Delete related token logs first to avoid foreign key constraint violation
    // const tokenIds = await knex('tokens').whereIn('employee_id', employeeIds).pluck('id');
    // await knex('token_logs').whereIn('token_id', tokenIds).del();
    
    // Delete related tokens for these employees
    // await knex('tokens').whereIn('employee_id', employeeIds).del();
    
    // Delete related records from id_hash_map
    // await knex('id_hash_map').whereIn('original_id', employeeIds).andWhere('table_name', 'employees').del();
    
    // Now, delete the employees
    // await knex('employees').whereIn('role_id', roleIdsToDelete).del();
    
    // Delete existing roles
    // await knex('roles').del();
    
    // Optionally, empty the entire id_hash_map table (if required)
    // await knex('id_hash_map').del();
    
    // Insert new roles
    await knex('roles').insert([
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'admin',
                description: 'Administrator - ' +
                    'Full access to all system resources, including user management, system settings, ' +
                    'and critical operations. Responsible for overseeing and managing the entire application.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'manager',
                description: 'Manager - Access to manage teams, view reports, and oversee day-to-day ' +
                    'operations within assigned departments. ' +
                    'Can create and manage users within their area of responsibility.'
            },
            {
                id: knex.raw('uuid_generate_v4()'),
                name: 'employee',
                description: 'Employee - Limited access to personal data and work-related resources. ' +
                    'Can view and update their own information, submit requests, ' +
                    'and access tasks or assignments specific to their role.'
            }
        ])
        .onConflict('name')  // Avoid inserting duplicate roles based on the 'name' column
        .ignore();  // If a conflict occurs, do nothing
};