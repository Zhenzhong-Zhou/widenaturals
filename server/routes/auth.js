const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const {setLogoutFlag, logLogoutAttempt} = require("../middlewares/logoutMiddleware");
const verifyToken = require("../middlewares/verifyToken");
const verifySession = require("../middlewares/verifySession");

router.post("/login", authController.login);
// Logout from the current session
router.post('/logout', setLogoutFlag, logLogoutAttempt, verifyToken, verifySession, authController.logout);

// Logout from all sessions
// todo implement logout
router.post('/logout-all', setLogoutFlag, logLogoutAttempt, verifyToken, verifySession, authController.logoutAll);
router.post("/forgot-password", authController.forgot);
router.post("/reset-password", authController.reset);

module.exports = router;