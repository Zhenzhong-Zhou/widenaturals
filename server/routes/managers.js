const express = require('express');
const router = express.Router();
const hrManagerController = require("../controllers/hrManagerController");
const authorize = require("../middlewares/authorize");

// Route to get a specific employee by ID
router.get('/:id', hrManagerController.getEmployeeById);

// Route to create a new employee: checkPermission('create_employee'), checkAction('create_employee'),
router.post('/employees/create', authorize(['create_employee', 'manage_employees']), hrManagerController.createEmployeeHR);

// Route to update an employee by ID
router.put('/:id', hrManagerController.updateEmployee);

// Route to delete an employee by ID
router.delete('/:id', hrManagerController.deleteEmployee);

module.exports = router;