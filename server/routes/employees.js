const express = require('express');
const router = express.Router();
const employeesController = require("../controllers/employeesController");
const authorize = require("../middlewares/auth/authorize");
const {upload} = require("../middlewares/image/uploadImageMiddleware");
const validateImage = require("../middlewares/validation/validateImageUpload");
const sanitizeImage = require("../middlewares/image/sanitizeImageMiddleware");

// Route to get all employees
router.get("/overview", authorize(['view_employee_overview']), employeesController.getAllEmployees);

// Route to get a specific employee by ID
router.get('/me', authorize(['view_profile']), employeesController.fetchEmployeeProfileById);

// Route to update an employee by ID
router.put('/me', employeesController.updateEmployee);

router.post('/me/profile/image',
    authorize(['upload_profile_image']), upload.single('image'),
    validateImage, sanitizeImage, employeesController.uploadEmployeeProfileImage);

module.exports = router;