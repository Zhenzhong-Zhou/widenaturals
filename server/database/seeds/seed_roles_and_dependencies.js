exports.seed = async function(knex) {
  // Step 1: Clean up existing related data to prevent foreign key conflicts
  const roleIdsToDelete = await knex('roles').pluck('id');
  const employeeIds = await knex('employees').whereIn('role_id', roleIdsToDelete).pluck('id');
  
  // Delete related tokens and employees first
  await knex('tokens').whereIn('employee_id', employeeIds).del();
  await knex('employees').whereIn('role_id', roleIdsToDelete).del();
  
  // Delete existing roles (if necessary)
  await knex('roles').del();
  
  // Step 2: Insert new roles
  await knex('roles').insert([
    { id: knex.raw('uuid_generate_v4()'), name: 'admin', description: 'Administrator' },
    { id: knex.raw('uuid_generate_v4()'), name: 'manager', description: 'Manager' },
    { id: knex.raw('uuid_generate_v4()'), name: 'employee', description: 'Employee' }
  ]);
};
