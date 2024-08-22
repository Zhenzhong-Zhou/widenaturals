const express = require('express');
const router = express.Router();
const adminController = require("../controllers/adminController");
const authorize = require("../middlewares/auth/authorize");
const validateEmployeeFields = require("../middlewares/validation/validateEmployeeFields");

router.post('/employees/create', authorize(['admin_access'], false), validateEmployeeFields, adminController.createEmployeeAdmin);

// todo: auth related logs select

module.exports = router;