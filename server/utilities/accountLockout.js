const { query } = require('../database/database');
const logger = require('../utilities/logger');

const checkAccountLockout = async (email) => {
    const result = await query('SELECT failed_attempts, lockout_time FROM employees WHERE email = $1', [email]);
    
    if (result.length > 0) {
        const { failed_attempts, lockout_time } = result[0];
        
        // Log a warning if the failed attempts are high (optional)
        if (failed_attempts > 3) {
            logger.warn(`Account ${email} has ${failed_attempts} failed login attempts.`);
        }
        
        // If the account is currently locked
        if (lockout_time && lockout_time > new Date()) {
            throw new Error('Account is locked. Please try again later.');
        }
    }
};

module.exports = { checkAccountLockout };