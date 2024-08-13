const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/verifyToken");
const verifySession = require("../middlewares/verifySession");

router.post("/login", authController.login);
// Logout from the current session
router.post('/logout', verifyToken, verifySession, authController.logout);

// Logout from all sessions
router.post('/logout-all', verifyToken, verifySession, authController.logoutAll);
router.post("/forgot-password", authController.forgot);
router.post("/reset-password", authController.reset);

module.exports = router;