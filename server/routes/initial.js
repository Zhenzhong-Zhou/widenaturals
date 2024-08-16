const express = require('express');
const router = express.Router();
const initialController = require("../controllers/initialController");

// router.post('/toggle-create', initialController.toggleAdminCreation);

router.post('/admin-creation', initialController.createAdmin);

module.exports = router;