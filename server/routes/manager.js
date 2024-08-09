const express = require('express');
const router = express.Router();
const managerController = require("../controllers/managerController");

// Route to get a specific employee by ID
router.get('/:id', managerController.getEmployeeById);

// Route to create a new employee: checkPermission('create_employee'), checkAction('create_employee'),
router.post('/employees/create',  managerController.createEmployee);

// Route to update an employee by ID
router.put('/:id', managerController.updateEmployee);

// Route to delete an employee by ID
router.delete('/:id', managerController.deleteEmployee);

module.exports = router;