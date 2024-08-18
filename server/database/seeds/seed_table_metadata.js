/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<unknown[]>}
 */
exports.seed = async function(knex) {
  return knex('table_metadata').del()
      .then(function () {
        return knex('table_metadata').insert([
          { table_name: 'employees', key: 'emp_rec', description: 'Information about employees' },
          { table_name: 'roles', key: 'usr_grp', description: 'Roles assigned to users' },
          { table_name: 'id_hash_map', key: 'id_map', description: 'Mapping of original IDs to hashed IDs with optional metadata' },
          { table_name: 'employee_passwords', key: 'usr_sec', description: 'Stores hashed passwords and salts for employees' },
          { table_name: 'audit_logs', key: 'chg_rec', description: 'Logs of changes and actions performed on records' },
          { table_name: 'login_history', key: 'acc_hist', description: 'Records of employee login events, including timestamps and IP addresses' },
          { table_name: 'tokens', key: 'auth_tkn', description: 'Stores tokens issued to employees, including their expiration and revocation status' },
          { table_name: 'token_logs', key: 'tkn_act', description: 'Logs actions performed on tokens such as usage or revocation' },
          { table_name: 'sessions', key: 'usr_sess', description: 'Stores session information including tokens, IP address, and user agent' },
          { table_name: 'session_logs', key: 'sess_act', description: 'Logs actions performed on sessions such as creation and revocation' },
          { table_name: 'permissions', key: 'acc_ctrl', description: 'List of permissions that can be assigned to roles' },
          { table_name: 'role_permissions', key: 'role_map', description: 'Mapping of roles to their assigned permissions' },
          { table_name: 'employee_roles', key: 'usr_role_map', description: 'Mapping of employees to their assigned roles' },
          { table_name: 'temporary_permissions', key: 'tmp_acc', description: 'Temporary permissions assigned to employees with expiration times' },
          { table_name: 'route_permissions', key: 'route_acc', description: 'Mapping of routes to their required permissions' },
          { table_name: 'employee_time_records', key: 'usr_time', description: 'Records of employee time, including working and vacation times' },
        ]);
      });
};