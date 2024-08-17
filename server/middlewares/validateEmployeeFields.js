const validateEmployeeData = (employeeData) => {
    const errors = [];
    
    // Validate first name
    if (!employeeData.first_name || employeeData.first_name.length > 50) {
        errors.push('First name is required and must be less than 50 characters.');
    }
    
    // Validate last name
    if (!employeeData.last_name || employeeData.last_name.length > 50) {
        errors.push('Last name is required and must be less than 50 characters.');
    }
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(employeeData.email)) {
        errors.push('Invalid email format.');
    }
    
    // Validate phone number format
    const phoneNumberRegex = /^\(\d{3}\)-\d{3}-\d{4}$/;
    if (!phoneNumberRegex.test(employeeData.phone_number)) {
        errors.push('Phone number must be in the format (XXX)-XXX-XXXX.');
    }
    
    // Validate password length and complexity
    if (!employeeData.password || employeeData.password.length < 8) {
        errors.push('Password is required and must be at least 8 characters long.');
    }
    
    // Validate job title
    if (!employeeData.job_title || employeeData.job_title.length > 100) {
        errors.push('Job title is required and must be less than 100 characters.');
    }
    
    // Validate role_id
    if (!employeeData.role_id) {
        errors.push('Role ID is required.');
    }
    
    // Validate status
    const validStatuses = ['active', 'inactive', 'terminated'];
    if (!validStatuses.includes(employeeData.status)) {
        errors.push(`Status must be one of the following: ${validStatuses.join(', ')}.`);
    }
    
    return errors;
};


const validateAdminData = (employeeData, existingAdminsCount) => {
    const errors = validateEmployeeData(employeeData);
    
    // Ensure the role is an admin role (assuming 'admin' is the name of the admin role)
    if (employeeData.role_name !== 'admin') {
        errors.push('The role assigned must be an admin role.');
    }
    
    // Additional security checks for the first admin
    if (existingAdminsCount === 0) {
        // For example, ensure that the first admin has a very strong password
        if (employeeData.password.length < 12) {
            errors.push('For the first admin, the password must be at least 12 characters long.');
        }
        
        // Check that the 'created_by' and 'updated_by' fields are not set
        if (employeeData.created_by || employeeData.updated_by) {
            errors.push('The first admin cannot be created by another user.');
        }
    }
    
    return errors;
};
