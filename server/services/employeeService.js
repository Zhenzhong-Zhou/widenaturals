const { hash } = require('bcrypt');
const { query } = require('../database/database');
const { errorHandler } = require('../middlewares/errorHandler');

const createUser = async ({ firstName, lastName, email, password, jobTitle, role, createdBy }) => {
    console.log(firstName, lastName, email, password, jobTitle, role, createdBy);
    try {
        const hashedPassword = await hash(password, 10);
        console.log(hashedPassword);
        const employee = await query(
            `INSERT INTO employees (first_name, last_name, email, password, job_title, role, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [firstName, lastName, email, hashedPassword, jobTitle, role, createdBy]
        );
        console.log("employee created: ", employee);
        return employee;
    } catch (error) {
        throw errorHandler(500, "Failed to create employee", error.message);
    }
}

module.exports = { createUser };