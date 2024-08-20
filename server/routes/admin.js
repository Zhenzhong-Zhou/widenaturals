const express = require('express');
const router = express.Router();
const adminController = require("../controllers/adminController");
const authorize = require("../middlewares/authorize");

router.post('/employees/create', authorize(['create_employee', 'manage_employees', 'admin_access']), adminController.createEmployeeAdmin);

// todo: auth related logs select

module.exports = router;