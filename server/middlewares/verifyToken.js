const { validateToken, refreshTokens } = require('../utilities/tokenUtils');
const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    try {
        // Try to retrieve the accessToken from cookies or headers
        const accessToken = req.cookies.accessToken || req.headers['authorization']?.split(' ')[1];
        const refreshToken = req.cookies.refreshToken;
        
        // Log the accessToken and refreshToken for debugging
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        
        if (!accessToken) {
            return res.status(401).json({ message: 'Access denied. No access token provided.' });
        }
        
        // Validate the access token
        const decodedAccessToken = validateToken(accessToken, process.env.JWT_ACCESS_SECRET);
        
        if (decodedAccessToken) {
            // Token is valid; attach the decoded information to the request object
            req.employee = decodedAccessToken;
            console.log('Decoded Access Token:', req.employee); // Log the decoded token
            
            // Log the employee ID (assuming it's stored in the 'sub' claim)
            console.log('Employee ID:', req.employee?.sub);  // <- Place the log here
            return next();
        }
        
        // Access token is invalid or expired, check if we have a refresh token
        if (!refreshToken) {
            return res.status(401).json({ message: 'Access denied. No refresh token provided.' });
        }
        
        // Validate and refresh tokens
        const tokens = await refreshTokens(refreshToken);
        
        if (!tokens) {
            return res.status(401).json({ message: 'Invalid or expired refresh token.' });
        }
        
        // Set the new tokens in the response cookies
        res.cookie('accessToken', tokens.accessToken, { httpOnly: true, secure: true });
        res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: true });
        
        // Attach the decoded access token payload to the request object
        req.employee = jwt.decode(tokens.accessToken);
        console.log('New Decoded Access Token:', req.employee); // Log the new decoded token
        
        next();
        
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = verifyToken;