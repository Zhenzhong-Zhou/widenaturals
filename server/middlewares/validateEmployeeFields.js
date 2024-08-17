const { body, validationResult } = require('express-validator');

const validateEmployeeFields = [
    body('first_name')
        .trim()
        .notEmpty()
        .withMessage('First name is required.')
        .isString()
        .withMessage('First name must be a string.')
        .isLength({ max: 50 })
        .withMessage('First name must be less than 50 characters.'),
    
    body('last_name')
        .trim()
        .notEmpty()
        .withMessage('Last name is required.')
        .isString()
        .withMessage('Last name must be a string.')
        .isLength({ max: 50 })
        .withMessage('Last name must be less than 50 characters.'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required.')
        .isEmail()
        .withMessage('Invalid email format.')
        .isLength({ max: 100 })
        .withMessage('Email must be less than 100 characters.'),
    
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required.')
        .isString()
        .withMessage('Password must be a string.')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long.'),
    
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // No further validation or processing needed, pass control to the next middleware or route handler
        try {
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error while fetching role ID.' });
        }
    }
];

module.exports = validateEmployeeFields;