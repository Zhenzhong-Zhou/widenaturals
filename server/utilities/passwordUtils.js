const {generateSalt} = require("./idUtils");
const {hash} = require("bcrypt");

const hashPassword = async (password) => {
    const customSalt = generateSalt();  // Generate the custom salt
    const hashedPassword = await hash(password + customSalt, 14);  // Combine with bcrypt's salting
    return {hashedPassword, customSalt};  // Return both the hashed password and the custom salt
};

module.exports = hashPassword;