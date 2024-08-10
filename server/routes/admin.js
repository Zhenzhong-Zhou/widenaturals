const express = require('express');
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post('/toggle-create', adminController.toggleAdminCreation);

// Admin can create both managers and employees: checkPermission('create_employee'), checkAction('create_employee'),
router.post('/managers/create', adminController.createManager);
router.post('/employees/create', adminController.createEmployee);

module.exports = router;