const express = require('express');
const router = express.Router();
const adminController = require("../controllers/adminController");
const authorize = require("../middlewares/authorize");

router.post('/employees/create', authorize(['create_employee', 'manage_employees']), adminController.createManager);
router.post('/employees/create', adminController.createEmployee);

// todo: auth related logs select

module.exports = router;