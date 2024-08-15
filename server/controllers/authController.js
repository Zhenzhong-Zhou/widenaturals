const {compare} = require("bcrypt");
const asyncHandler = require("../middlewares/asyncHandler");
const {errorHandler} = require("../middlewares/errorHandler");
const {query} = require("../database/database");
const {checkAccountLockout} = require("../utilities/auth/accountLockout");
const {generateToken, revokeToken, refreshTokens} = require("../utilities/auth/tokenUtils");
const {logAuditAction, logLoginHistory, logSessionAction, logTokenAction} = require("../utilities/log/auditLogger");
const logger = require("../utilities/logger");
const {revokeSession, revokeAllSessions} = require("../utilities/auth/sessionUtils");
const { storeInIdHashMap, generateSalt, hashID, getIDFromMap} = require("../utilities/idUtils");

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    
    try {
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
            
            // Log failed login attempt
            await logAuditAction('auth', 'employees', 'login_failed', employee.id, employee.id, null, { email: employee.email });
            
            // Lock the account if too many failed attempts
            if (employee.failed_attempts + 1 >= 5) {
                const lockoutDuration = 15 * 60 * 1000; // 15 minutes
                await query('UPDATE employees SET lockout_time = $1 WHERE id = $2', [new Date(Date.now() + lockoutDuration), employee.id]);
                
                // Log account lockout in audit logs
                await logAuditAction('auth', 'employees', 'account_locked', employee.id, employee.id, null, { email: employee.email, lockout_time: new Date(Date.now() + lockoutDuration) });
                
                return res.status(401).json({ message: 'Account locked due to too many failed login attempts. Please try again later.' });
            }
            
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        // Reset failed attempts and update last login on successful login
        await query('UPDATE employees SET failed_attempts = 0, lockout_time = NULL, last_login = NOW() WHERE id = $1', [employee.id]);
        
        // Check the number of active sessions
        const sessionCount = await query('SELECT COUNT(*) FROM sessions WHERE employee_id = $1 AND revoked = FALSE AND expires_at > NOW()', [employee.id]);
        
        // Allow only one active session per user (or adjust as needed)
        if (sessionCount[0].count >= 1) {
            // Invalidate all sessions except the most recent one
            const revokeSessionsQuery = `
                UPDATE sessions
                SET revoked = TRUE
                WHERE employee_id = $1
                AND id != (SELECT id FROM sessions WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1)
            `;
            await query(revokeSessionsQuery, [employee.id]);
            
            // Revoke tokens associated with the revoked sessions
            const revokeTokensQuery = `
                UPDATE tokens
                SET revoked = TRUE
                WHERE employee_id = $1
                AND revoked = FALSE
                AND expires_at > NOW()
            `;
            await query(revokeTokensQuery, [employee.id]);
        }
        
        // Generate access and refresh tokens
        const accessToken = await generateToken(employee, 'access');
        const refreshToken = await generateToken(employee, 'refresh');
        
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        
        // Create a session in the database
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);  // Example: 30 minutes
        
        const sessionResult = await query(
            'INSERT INTO sessions (employee_id, token, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [employee.id, accessToken, userAgent, ipAddress, expiresAt]
        );
        
        const sessionId = sessionResult[0].id;
        
        // Hash the session ID with generated salt
        const salt = generateSalt();
        const hashedID = hashID(sessionId, salt);
        
        // Store the hashed session ID in the id_hash_map
        await storeInIdHashMap({
            originalID: sessionId,
            hashedID,
            tableName: 'sessions',
            salt,
            expiresAt
        });
        
        // Log the token generation with sessionId included in the loginDetails
        const loginDetails = {
            method: 'standard',
            device: userAgent,
            location: 'Unknown',
            timestamp: new Date().toISOString(),
            sessionId,  // Include the session ID
            actionType: 'login'  // Indicate that this is related to login
        };
        
        await logTokenAction(employee.id, null, 'access', 'generated', ipAddress, userAgent, loginDetails);
        await logTokenAction(employee.id, null, 'refresh', 'generated', ipAddress, userAgent, loginDetails);
        
        // Log the successful login attempt and session creation
        await logAuditAction('auth', 'employees', 'login_success', employee.id, employee.id, null, { email: employee.email });
        await logAuditAction('auth', 'sessions', 'session_created', sessionId, employee.id, null, { sessionId, ipAddress, userAgent });
        await logLoginHistory(employee.id, ipAddress, userAgent);
        await logSessionAction(sessionId, employee.id, 'created', ipAddress, userAgent);
        
        // Send success response with tokens in cookies
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
        
        res.status(200).json({
            message: 'Login successful',
            accessToken
        });
    } catch (error) {
        if (error.message === 'Account is locked. Please try again later.') {
            return res.status(401).json({ message: error.message });
        }
        
        // General error handling for unexpected errors
        logger.error('Error during login process', { error: error.message });
        errorHandler(500, 'Internal server error');
    }
});

// Logout from the current session
const logout = asyncHandler(async (req, res) => {
    try {
        if (!req.session || !req.session.id) {
            logger.warn('Logout attempt with no valid session', { context: 'logout', employeeId: req.employee.sub });
            return res.status(400).json({ message: 'No valid session found to log out.' });
        }
        
        const sessionId = req.session.id;
        const hashedEmployeeId = req.employee.sub;
        const refreshToken = req.cookies.refreshToken;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        
        // Get the original employee ID from the hash
        const employeeId = await getIDFromMap(hashedEmployeeId, 'employees');
        
        // Revoke the current session
        await revokeSession(sessionId, employeeId, ipAddress, userAgent);
        // todo cleanup id hash map, token be true, session be true
        // Log the session revocation in audit logs
        await logAuditAction('auth', 'sessions', 'revoke', sessionId, employeeId, null, { ipAddress, userAgent });
        
        // Revoke the tokens
        await revokeToken(refreshToken, ipAddress, userAgent);
        
        const refreshTokenId = await getIDFromMap(refreshToken, 'tokens');
        
        // Log the token revocation in audit logs
        await logAuditAction('auth', 'tokens', 'revoke', refreshTokenId, employeeId, null, { ipAddress, userAgent, tokenType: 'refresh' });
        
        // Clear cookies (e.g., access token and refresh token)
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        
        // Send a response
        res.status(200).json({ message: 'Successfully logged out.' });
        
        // Log the successful session revocation after sending the response
        await logSessionAction(sessionId, employeeId, 'revoked', ipAddress, userAgent);
        
    } catch (error) {
        logger.error('Error during logout', {
            context: 'logout',
            error: error.message,
            employeeId: req.employee ? req.employee.sub : 'unknown',
            sessionId: req.session ? req.session.id : 'unknown'
        });
        
        // Log the error in audit logs
        await logAuditAction('auth', 'logout', 'error', null, req.employee ? req.employee.sub : 'unknown', null, { error: error.message });
        
        errorHandler(500, 'Internal server error during logout.');
    }
});

// Logout from all sessions
const logoutAll = asyncHandler(async (req, res) => {
    const employeeId = req.employee.sub;
    
    // Revoke all sessions for the employee
    const revokedSessions = await revokeAllSessions(employeeId);
    
    // Log the revocation of all sessions
    for (const session of revokedSessions) {
        await logSessionAction(session.id, employeeId, 'revoked', req.ip, req.get('User-Agent'));
    }
    
    // Clear cookies (e.g., access token)
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken'); // Assuming you use a refresh token in cookies
    
    // Send a response
    res.status(200).json({ message: 'Successfully logged out from all devices.' });
});

const forgot = asyncHandler(async (req, res, next) => {
    res.status(200).send("Welcome to use the server of WIDE Naturals INC. Enterprise Resource Planning.")
});

const reset = asyncHandler(async (req, res, next) => {
    res.status(200).send("Welcome to use the server of WIDE Naturals INC. Enterprise Resource Planning.")
});

module.exports = {login, logout, logoutAll, forgot, reset};