const {hash} = require('bcrypt');
const {query} = require('../database/database');
const {errorHandler} = require('../middlewares/errorHandler');
const validatePassword = require("../utilities/validation/validatePassword");

const createUser = async ({firstName, lastName, email, phoneNumber, password, jobTitle, role_id, createdBy}) => {
    try {
        // Validate password strength
        validatePassword(password);
        
        const hashedPassword = await hash(password, 14);

        return await query(
            `INSERT INTO employees (first_name, last_name, email, phone_number, password, job_title, role_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [firstName, lastName, email, phoneNumber, hashedPassword, jobTitle, role_id, createdBy]
        );
    } catch (error) {
        throw errorHandler(500, "Failed to create employee", error.message);
    }
};

module.exports = {createUser};