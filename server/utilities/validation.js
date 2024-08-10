const validatePassword = (password) => {
    // Password must be 16-32 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{16,32}$/;
    
    if (!passwordRegex.test(password)) {
        throw new Error("Password must be 16-32 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character.");
    }
};

module.exports = {
    validatePassword,
};