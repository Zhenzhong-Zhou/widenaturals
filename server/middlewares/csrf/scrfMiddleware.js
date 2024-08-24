const csrf = require('csurf');

// Initialize CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

module.exports = csrfProtection;