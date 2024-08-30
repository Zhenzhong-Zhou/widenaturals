const {compare} = require("bcrypt");
const asyncHandler = require("../middlewares/utils/asyncHandler");
const {errorHandler} = require("../middlewares/error/errorHandler");
const {query, incrementOperations, decrementOperations} = require("../database/database");
const {checkAccountLockout} = require("../utilities/auth/accountLockout");
const {generateToken, revokeToken, refreshTokens} = require("../utilities/auth/tokenUtils");
const {revokeSession, generateSession, validateSession} = require("../utilities/auth/sessionUtils");
const {getIDFromMap} = require("../utilities/idUtils");
const {logAuditAction, logLoginHistory, logSessionAction, logTokenAction} = require("../utilities/log/auditLogger");
const logger = require("../utilities/logger");

const login = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        
        // Begin transaction and increment the counter before starting the operation
        await query('BEGIN');
        incrementOperations();
        
        // Check if the account is locked
        await checkAccountLockout(email);
        
        // Fetch user from the database
        const queryText = 'SELECT id, email, role_id, failed_attempts FROM employees WHERE email = $1';
        const result = await query(queryText, [email]);
        
        if (result.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        const employee = result[0];
        
        // Fetch the password hash and salt from the employee_passwords table
        const passwordQueryText = 'SELECT password_hash, password_salt FROM employee_passwords WHERE employee_id = $1';
        const passwordResult = await query(passwordQueryText, [employee.id]);
        
        if (passwordResult.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        const { password_hash, password_salt } = passwordResult[0];
        
        // Combine provided password with the salt and compare with the stored hash
        const isMatch = await compare(password + password_salt, password_hash);
        if (!isMatch) {
            // Increment failed attempts and update in employees table
            await query('UPDATE employees SET failed_attempts = failed_attempts + 1 WHERE id = $1', [employee.id]);
            
            await logLoginHistory(employee.id, ipAddress, userAgent);
            // Log failed login attempt
            await logAuditAction('auth', 'employees', 'login_failed', employee.id, employee.id, null, { email: employee.email });
            
            // Lock the account if too many failed attempts
            if (employee.failed_attempts + 1 >= 5) {
                const lockoutDuration = 15 * 60 * 1000;  // 15 minutes
                const lockoutTime = new Date(Date.now() + lockoutDuration);
                await query('UPDATE employees SET lockout_time = $1 WHERE id = $2', [lockoutTime, employee.id]);
                
                // Log account lockout in audit logs
                await logAuditAction('auth', 'employees', 'account_locked', employee.id, employee.id, null, { email: employee.email, lockout_time: lockoutTime });
                
                return res.status(401).json({ message: 'Account locked due to too many failed login attempts. Please try again later.' });
            }
            
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        // Reset failed attempts and update last login on successful login
        await query('UPDATE employees SET failed_attempts = 0, lockout_time = NULL, last_login = NOW() WHERE id = $1', [employee.id]);
        
        // Revoke previous sessions and refresh tokens before creating new ones
        await query('UPDATE sessions SET revoked = TRUE WHERE employee_id = $1 AND revoked = FALSE', [employee.id]);
        await query('UPDATE tokens SET revoked = TRUE WHERE employee_id = $1 AND revoked = FALSE', [employee.id]);
        
        // Log successful login in login_history
        await logAuditAction('auth', 'employees', 'login_succeed', employee.id, employee.id, null, { email: employee.email });
        
        // Generate access and refresh tokens
        const accessToken = await generateToken(employee, 'access');
        const refreshToken = await generateToken(employee, 'refresh');
        
        const { sessionId, hashedSessionId } = await generateSession(employee.id, accessToken, userAgent, ipAddress);
        
        // Log the token generation with sessionId included in the loginDetails
        const loginDetails = {
            method: 'standard',
            device: userAgent,
            location: 'Unknown',
            timestamp: new Date().toISOString(),
            session_id: sessionId,  // Include the session ID
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
        res.cookie('sessionId', hashedSessionId, { httpOnly: true, secure: true, sameSite: 'Strict' });
        
        await query('COMMIT');
        // res.status(200).json({message: 'Login successful', hashedSessionId});
        res.status(200).json({message: 'Login successful'});
    } catch (error) {
        await query('ROLLBACK');
        if (error.message === 'Account is locked. Please try again later.') {
            return res.status(401).json({ message: error.message });
        }
        
        // General error handling for unexpected errors
        logger.error('Error during login process', { error: error.message });
        errorHandler(500, 'Internal server error');
    } finally {
        // Decrement the counter after completing the operation
        decrementOperations();
    }
});

const check = asyncHandler(async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;
        
        if (!accessToken || !refreshToken) {
            logger.warn('Access or refresh token missing', { context: 'auth' });
            return res.status(401).json({ message: 'Authentication required.' });
        }
        
        // Validate the session
        const { session, sessionExpired } = await validateSession(accessToken);
        
        if (!session || sessionExpired) {
            // If session expired, attempt to refresh tokens and session
            const newTokens = await refreshTokens(refreshToken);
            
            if (!newTokens) {
                logger.warn('Failed to refresh tokens during session check', { context: 'auth' });
                return res.status(401).json({ message: 'Session expired. Please log in again.' });
            }
            
            await generateSession(req.employee.id, newTokens.accessToken, req.get('User-Agent'), req.ip);
            
            // Send session ID back to client
            return res.status(200).json({ message: 'Pass' });
        }
        
        // If session is valid, send current session ID
        res.status(200).json({ message: 'Pass' });
    } catch (error) {
        logger.error('Error during authentication check:', {
            context: 'authentication_check',
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        errorHandler(500, 'Internal server error');
    }
});

const refresh = asyncHandler(async (req, res, next) => {
    try {
        const originalEmployeeId = req.employee.originalEmployeeId;
        const refreshToken = req.cookies.refreshToken;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        
        if (!refreshToken) {
            logger.warn('No refresh token provided', { context: 'auth', ipAddress });
            return res.status(401).json({ message: 'Refresh token is required.' });
        }
        
        // Attempt to refresh the tokens
        const newTokens = await refreshTokens(refreshToken, ipAddress, userAgent);
        if (!newTokens) {
            logger.warn('Failed to refresh tokens', { context: 'auth', ipAddress });
            return res.status(401).json({ message: 'Failed to refresh tokens. Please log in again.' });
        }
        
        const newSessionId = await generateSession(originalEmployeeId, newTokens.accessToken, userAgent, ipAddress);
        
        // Set new tokens in cookies
        res.cookie('accessToken', newTokens.accessToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.cookie('refreshToken', newTokens.refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.cookie('sessionId', newSessionId, { httpOnly: true, secure: true, sameSite: 'Strict' });
        
        // Log token refresh
        logger.info('Tokens refreshed successfully', { context: 'auth', userId: originalEmployeeId });
        await logTokenAction(originalEmployeeId, newTokens.refreshTokenId, 'refresh', 'refreshed', ipAddress, userAgent, { reason: 'Client-initiated refresh' });
        
        // Log token refresh in audit logs
        await logAuditAction('auth', 'tokens', 'refresh', newTokens.refreshTokenId, originalEmployeeId, null, { newTokens });
        
        return res.status(200).json({ message: 'Tokens refreshed successfully.' });
    } catch (error) {
        logger.error('Error during token refresh', { context: 'auth', error: error.message });
        return res.status(500).json({ message: 'Internal server error during token refresh.' });
    }
});

// Logout from the current session
const logout = asyncHandler(async (req, res) => {
    try {
        // Begin transaction and increment the counter before starting the operation
        await query('BEGIN');
        incrementOperations();
        
        if (!req.session || !req.session.id) {
            logger.warn('Logout attempt with no valid session', { context: 'logout', employeeId: req.employee.sub });
            await query('ROLLBACK');
            return res.status(400).json({ message: 'No valid session found to log out.' });
        }
        
        const sessionId = req.session.id;
        const employeeId = req.employee.originalEmployeeId;
        const refreshToken = req.cookies.refreshToken;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        
        // Revoke the current session
        await revokeSession(sessionId, employeeId, ipAddress, userAgent);
        
        // Log the session revocation in audit logs
        await logAuditAction('auth', 'sessions', 'revoke', sessionId, employeeId, null, { ipAddress, userAgent });
        
        // Revoke the tokens
        await revokeToken(refreshToken, ipAddress, userAgent);
        
        const refreshTokenId = await getIDFromMap(refreshToken, 'tokens');
        
        // Log the token revocation in audit logs
        await logAuditAction('auth', 'tokens', 'revoke', refreshTokenId, employeeId, null, { ipAddress, userAgent, tokenType: 'refresh' });
        
        // Log the successful session revocation before sending the response
        await logSessionAction(sessionId, employeeId, 'revoked', ipAddress, userAgent);
        
        // Clear cookies (e.g., access token and refresh token)
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        
        // Commit the transaction if logout is handled successfully
        await query('COMMIT');
        
        // Send a response
        res.status(200).json({ message: 'Successfully logged out.' });
    } catch (error) {
        // Rollback in case of error
        await query('ROLLBACK');
        
        logger.error('Error during logout', {
            context: 'logout',
            error: error.message,
            employeeId: req.employee ? req.employee.originalEmployeeId : 'unknown',
            sessionId: req.session ? req.session.id : 'unknown'
        });
        
        errorHandler(500, 'Internal server error.');
    } finally {
        // Always decrement operation count at the end
        decrementOperations();
    }
});

// Logout from all sessions
const logoutAll = asyncHandler(async (req, res) => {
    const employeeId = req.employee.originalEmployeeId;
    
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

module.exports = {login, check, refresh, logout, logoutAll, forgot, reset};