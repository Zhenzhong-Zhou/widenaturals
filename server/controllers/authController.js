const {compare} = require("bcrypt");
const asyncHandler = require("../middlewares/asyncHandler");
const {errorHandler} = require("../middlewares/errorHandler");
const { query } = require("../database/database");
const {checkAccountLockout} = require("../utilities/accountLockout");
const {generateToken} = require("../utilities/tokenUtils");
const {logAuditAction, logLoginHistory} = require("../utilities/auditLogger");

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    
    // Check if the account is locked
    await checkAccountLockout(email);
    
    // Fetch user from the database
    const queryText = 'SELECT id, email, password, role_id, failed_attempts FROM employees WHERE email = $1';
    const result = await query(queryText, [email]);
    
    if (result.length === 0) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const employee = result[0];
    
    // Check if the password matches
    const isMatch = await compare(password, employee.password);
    if (!isMatch) {
        // Increment failed attempts
        await query('UPDATE employees SET failed_attempts = failed_attempts + 1 WHERE id = $1', [employee.id]);
        
        // Lock the account if too many failed attempts
        if (employee.failed_attempts + 1 >= 5) {
            const lockoutDuration = 15 * 60 * 1000; // 15 minutes
            await query('UPDATE employees SET lockout_time = $1 WHERE id = $2', [new Date(Date.now() + lockoutDuration), employee.id]);
            return res.status(401).json({ message: 'Account locked due to too many failed login attempts. Please try again later.' });
        }
        
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Reset failed attempts and update last login on successful login
    await query('UPDATE employees SET failed_attempts = 0, lockout_time = NULL, last_login = NOW() WHERE id = $1', [employee.id]);
    
    // Generate access and refresh tokens
    const accessToken = await generateToken(employee, 'access');
    const refreshToken = await generateToken(employee, 'refresh');
    
    // Create a session in the database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);  // Example: 7 days from now
    
    await query(
        'INSERT INTO sessions (employee_id, token, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5)',
        [employee.id, accessToken, req.get('User-Agent'), req.ip, expiresAt]
    );
    
    // Log the successful login attempt
    await logAuditAction('employees', 'login_success', employee.id, employee.id);
    await logLoginHistory(employee.id, req.ip, req.get('User-Agent'));
    
    // Send success response with tokens in cookies
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
    
    res.status(200).json({
        message: 'Login successful',
        accessToken
    });
});

const logout = asyncHandler(async (req, res, next) => {
    res.status(200).send("Welcome to use the server of WIDE Naturals INC. Enterprise Resource Planning.")
});

const forgot = asyncHandler(async (req, res, next) => {
    res.status(200).send("Welcome to use the server of WIDE Naturals INC. Enterprise Resource Planning.")
});

const reset = asyncHandler(async (req, res, next) => {
    res.status(200).send("Welcome to use the server of WIDE Naturals INC. Enterprise Resource Planning.")
});

module.exports = {login, logout, forgot, reset};