module.exports = [
    {pattern: '/api/v1/health', service: 'system_service'},
    {pattern: '/api/v1/welcome', service: 'welcome_service'},
    {pattern: '/api/v1/auth/*', service: 'auth_service'},
    {pattern: '/api/v1/employees/*', service: 'employee_service'},
];