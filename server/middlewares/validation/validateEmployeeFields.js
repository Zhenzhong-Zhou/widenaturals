const { body, validationResult } = require('express-validator');
const { validateEmployeeData, checkAdminExists} = require('../../utilities/validators/validateEmployee');
const {getRoleDetails} = require("../../services/roleService");

const validateEmployeeFields = [
    // Switch validation based on the request method (Create vs. Update)
    body('first_name')
        .if((value, { req }) => req.method === 'POST')
        .trim()
        .notEmpty()
        .withMessage('First name is required.')
        .isString()
        .withMessage('First name must be a string.')
        .isLength({ max: 50 })
        .withMessage('First name must be less than 50 characters.')
        .optional({ nullable: true }), // Optional for update
    
    body('last_name')
        .if((value, { req }) => req.method === 'POST')
        .trim()
        .notEmpty()
        .withMessage('Last name is required.')
        .isString()
        .withMessage('Last name must be a string.')
        .isLength({ max: 50 })
        .withMessage('Last name must be less than 50 characters.')
        .optional({ nullable: true }), // Optional for update
    
    body('email')
        .if((value, { req }) => req.method === 'POST')
        .trim()
        .notEmpty()
        .withMessage('Email is required.')
        .isEmail()
        .withMessage('Invalid email format.')
        .isLength({ max: 100 })
        .withMessage('Email must be less than 100 characters.')
        .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        .withMessage('Email format is incorrect.')
        .optional({ nullable: true }), // Optional for update
    
    body('phone_number')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required.')
        .matches(/^\(\d{3}\)-\d{3}-\d{4}$/)
        .withMessage('Phone number format is incorrect.')
        .optional({ nullable: true }), // Optional for update
    
    body('job_title')
        .if((value, { req }) => req.method === 'POST')
        .notEmpty()
        .withMessage('Job title is required.')
        .trim()
        .matches(/^[A-Z][a-z]*( [A-Z][a-z]*)*$/)
        .withMessage('Job title must start with an uppercase letter and only contain letters, with each word starting with an uppercase letter.')
        .optional({ nullable: true }), // Optional for update
    
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
    
    body('password')
        .if((value, { req }) =>
            req.method === 'POST' ||
            ((req.method === 'PUT' || req.method === 'PATCH') && value !== undefined)
        )
        .trim()
        .notEmpty()
        .withMessage('Password is required.')
        .isString()
        .withMessage('Password must be a string.')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long.')
        .optional({ nullable: true }), // Optional for update if not provided
    
    body('status')
        .optional()
        .isString()
        .isIn(['active', 'inactive', 'terminated'])
        .withMessage('Status must be one of the following: active, inactive, or terminated.'),
    
    body('two_factor_code')
        .optional()
        .isLength({ max: 6 })
        .withMessage('Two-factor code must be 6 digits long.')
        .matches(/^\d{6}$/)
        .withMessage('Two-factor code must be numeric and exactly 6 digits long.'),
    
    body('two_factor_enabled')
        .optional()
        .isBoolean()
        .withMessage('Two-factor enabled must be a boolean value.'),
    
    body('two_factor_method')
        .optional()
        .isString()
        .isIn(['sms', 'email'])
        .withMessage('Two-factor method must be either "sms" or "email".'),
    
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