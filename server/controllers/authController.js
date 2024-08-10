const {compare} = require("bcrypt");
const {sign} = require("jsonwebtoken");
const asyncHandler = require("../middlewares/asyncHandler");
const {errorHandler} = require("../middlewares/errorHandler");
const { query } = require("../database/database");
const {generateToken} = require("../utilities/tokenUtils");

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    
    // Fetch user from the database
    const queryText = 'SELECT id, email, password, role_id FROM employees WHERE email = $1';
    const result = await query(queryText, [email]);
    
    if (result.length === 0) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const employee = result[0];
    console.log(employee)
    
    // Check if the password matches
    const isMatch = await compare(password, employee.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate access and refresh tokens
    const accessToken = await generateToken(employee, 'access');
    const refreshToken = await generateToken(employee, 'refresh');
    
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