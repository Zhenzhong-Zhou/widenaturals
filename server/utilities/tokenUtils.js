const jwt = require('jsonwebtoken');
const { query } = require("../database/database");

// Generate Token (Access or Refresh)
const generateToken = async (employee, type = 'access') => {
    // Debugging: Log the employee object to ensure role is present
    console.log("Employee object before token generation:", employee);
    
    const payload = {
        sub: employee.id,  // Ensure this is a UUID
        iat: Math.floor(Date.now() / 1000),
        role: employee.role_id,
        aud: process.env.JWT_AUDIENCE,
        iss: process.env.JWT_ISSUER,
    };
    
    // Debugging: Log the payload before signing the token
    console.log("JWT Payload:", payload);
    
    let secret;
    let options;
    
    if (type === 'access') {
        secret = process.env.JWT_ACCESS_SECRET;
        options = { expiresIn: '15m' };
    } else if (type === 'refresh') {
        secret = process.env.JWT_REFRESH_SECRET;
        options = { expiresIn: '7d' };
    } else {
        throw new Error('Invalid token type');
    }
    
    const token = jwt.sign(payload, secret, options);
    
    if (type === 'refresh') {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        await storeRefreshToken(employee.id, token, expiresAt);
    }
    
    return token;
};

// Store Refresh Token in the Database
const storeRefreshToken = async (employeeId, token, expiresAt) => {
    try {
        await query(
            'INSERT INTO tokens (employee_id, token, token_type, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [employeeId, token, 'refresh', expiresAt]
        );
    } catch (error) {
        console.error('Error storing refresh token:', error);
        throw new Error('Failed to store refresh token');
    }
};

// Validate Token (Access or Refresh)
const validateToken = (token, secret, options = {}) => {
    try {
        return jwt.verify(token, secret, options);
    } catch (error) {
        console.error('Invalid token:', error);
        return null; // Return null if the token is invalid or expired
    }
};

// Revoke Refresh Token
const revokeToken = async (token) => {
    try {
        await query(
            'UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1',
            [token]
        );
    } catch (error) {
        console.error('Error revoking token:', error);
        throw new Error('Failed to revoke token');
    }
};

// Validate Refresh Token from the Database
const validateStoredRefreshToken = async (refreshToken) => {
    try {
        const result = await query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()',
            [refreshToken]
        );
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error validating stored refresh token:', error);
        throw new Error('Failed to validate stored refresh token');
    }
};

// Refresh Tokens (Automatically issues new Access and Refresh tokens)
const refreshTokens = async (refreshToken) => {
    const storedToken = await validateStoredRefreshToken(refreshToken);
    
    if (!storedToken) {
        throw new Error('Invalid or revoked refresh token');
    }
    
    const employee = { id: storedToken.employee_id }; // Retrieve user details based on your needs
    const newAccessToken = generateToken(employee, 'access');
    const newRefreshToken = await generateToken(employee, 'refresh');
    
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

module.exports = {
    generateToken,
    validateToken,
    revokeToken,
    validateStoredRefreshToken,
    refreshTokens,
};