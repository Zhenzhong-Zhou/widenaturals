const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgot);
router.post("/reset-password", authController.reset);

module.exports = router;