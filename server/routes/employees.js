const express = require('express');
const router = express.Router();
const employeesController = require("../controllers/employeesController");

// Route to get all employees
router.get("/basic-info", employeesController.getAllEmployees);

// Route to get a specific employee by ID
router.get('/me', employeesController.getEmployeeById);

// Route to update an employee by ID
router.put('/me', employeesController.updateEmployee);

module.exports = router;