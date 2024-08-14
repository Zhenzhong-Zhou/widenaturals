exports.seed = async function (knex) {
    const roleIdsToDelete = await knex('roles').pluck('id');
    const employeeIds = await knex('employees').whereIn('role_id', roleIdsToDelete).pluck('id');
    
    // Delete related audit logs first
    await knex('audit_logs').whereIn('employee_id', employeeIds).del();
    
    // Delete related token logs first (to avoid foreign key constraint violation)
    const tokenIds = await knex('tokens').whereIn('employee_id', employeeIds).pluck('id');
    await knex('token_logs').whereIn('token_id', tokenIds).del();
    
    // Delete related tokens for these employees
    await knex('tokens').whereIn('employee_id', employeeIds).del();
    
    // Mark employees as soft-deleted
    await knex('employees').whereIn('id', employeeIds).update({deleted_at: knex.fn.now()});
    
    // Delete related records from id_hash_map
    await knex('id_hash_map').whereIn('original_id', employeeIds).andWhere('table_name', 'employees').del();
    
    // Delete the employees now
    await knex('employees').whereIn('role_id', roleIdsToDelete).del();
    
    // Delete existing roles
    await knex('roles').del();
    
    // Empty the entire id_hash_map table (optional)
    await knex('id_hash_map').del();
    
    // Step 2: Insert new roles
    await knex('roles').insert([
        {id: knex.raw('uuid_generate_v4()'), name: 'admin', description: 'Administrator'},
        {id: knex.raw('uuid_generate_v4()'), name: 'manager', description: 'Manager'},
        {id: knex.raw('uuid_generate_v4()'), name: 'employee', description: 'Employee'}
    ]);
};