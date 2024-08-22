const express = require('express');
const router = express.Router();
const employeesController = require("../controllers/employeesController");
const authorize = require("../middlewares/authorize");

// Route to get all employees
router.get("/overview", authorize(['view_employee_overview']), employeesController.getAllEmployees);

// Route to get a specific employee by ID
router.get('/me', employeesController.getEmployeeById);

// Route to update an employee by ID
router.put('/me', employeesController.updateEmployee);

module.exports = router;