const {query} = require('../../database/database');

const validateEmployeeData = async (data) => {
    let errors = [];
    
    // Example: Check if email already exists in the database
    const existingEmployee = await query('SELECT id FROM employees WHERE email = $1', [data.email]);
    if (existingEmployee.length > 0) {
        errors.push({ msg: 'Email is already registered', param: 'email' });
    }
    
    // Example: Custom logic for phone number or other fields
    if (!/^\(\d{3}\)-\d{3}-\d{4}$/.test(data.phone_number)) {
        errors.push({ msg: 'Phone number format is incorrect', param: 'phone_number' });
    }
    
    // Add more custom validations as needed
    
    return errors;
};
