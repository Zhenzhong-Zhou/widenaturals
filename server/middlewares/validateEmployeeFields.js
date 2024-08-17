const { body, validationResult } = require('express-validator');
const {getOrCreateRole} = require("../services/roleService");

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
    
    body('phone_number')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required.')
        .matches(/^\(\d{3}\)-\d{3}-\d{4}$/)
        .withMessage('Phone number must be in the format (XXX)-XXX-XXXX.'),
    
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required.')
        .isString()
        .withMessage('Password must be a string.')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long.'),
    
    body('job_title')
        .trim()
        .notEmpty()
        .withMessage('Job title is required.')
        .isString()
        .withMessage('Job title must be a string.')
        .isLength({ max: 100 })
        .withMessage('Job title must be less than 100 characters.'),
    
    body('role')
        .notEmpty()
        .withMessage('Role is required.'),
    
    body('status')
        .notEmpty()
        .withMessage('Status is required.')
        .isIn(['active', 'inactive', 'terminated'])
        .withMessage('Invalid status.'),
    
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Fetch the role ID based on the role name
        const roleName = req.body.role;
        try {
            const result = await getOrCreateRole(roleName);
            if (result.length === 0) {
                return res.status(400).json({ errors: [{ msg: 'Invalid role name.', param: 'role', location: 'body' }] });
            }
            req.body.role_id = result[0].id;
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error while fetching role ID.' });
        }
    }
];

module.exports = validateEmployeeFields;