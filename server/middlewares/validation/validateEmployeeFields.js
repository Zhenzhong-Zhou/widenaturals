const { body, validationResult } = require('express-validator');
const { validateEmployeeData } = require('../../utilities/validators/validateEmployee');
const {getRoleDetails} = require("../../services/roleService");

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
    
    body('phone_number')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required.')
        .matches(/^\(\d{3}\)-\d{3}-\d{4}$/)
        .withMessage('Phone number format is incorrect.'),
    
    body('job_title')
        .notEmpty()
        .trim()
        .matches(/^[A-Z][a-z]*( [A-Z][a-z]*)*$/)
        .withMessage('Job title must start with an uppercase letter and only contain letters, with each word starting with an uppercase letter.'),
    
    body('role_name')
        .trim()
        .notEmpty()
        .withMessage('Role name is required.')
        .isString()
        .withMessage('Role name must be a string.')
        .custom(async (roleName, { req }) => {
            // Fetch role details by name
            const roleDetails = await getRoleDetails({ name: roleName });
            
            // Attach the role ID to the request body
            req.body.role_id = roleDetails.id;
        }),
    
    body('metadata')
        .optional()
        .custom((value) => {
            try {
                if (value && typeof value === 'string') {
                    JSON.parse(value); // Ensure it is valid JSON if provided as a string
                }
                return true;
            } catch (err) {
                throw new Error('Metadata must be a valid JSON object.');
            }
        }),
    
    async (req, res, next) => {
        // Perform synchronous validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Perform asynchronous validation
        const customErrors = await validateEmployeeData(req.body);
        if (customErrors.length > 0) {
            return res.status(400).json({ errors: customErrors });
        }
        
        // If all validations pass, move to the next middleware or route handler
        next();
    }
];

module.exports = validateEmployeeFields;