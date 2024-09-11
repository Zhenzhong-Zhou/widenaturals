const express = require('express');
const router = express.Router();
const rateLimiterConfig = require("../utilities/rateLimiterConfig");
const authController = require("../controllers/authController");
const {setLogoutFlag, logLogoutAttempt} = require("../middlewares/auth/logoutMiddleware");
const verifyToken = require("../middlewares/auth/verifyToken");
const verifySession = require("../middlewares/auth/verifySession");

router.post("/login", rateLimiterConfig.loginLimiter, authController.login);
router.get("/check", rateLimiterConfig.checkLimiter, verifyToken, verifySession, authController.checkAuthentication);
router.post("/refresh", rateLimiterConfig.checkLimiter, verifyToken, verifySession, authController.refreshAuthentication);
// Logout from the current session
router.post('/logout', setLogoutFlag, verifyToken, verifySession, logLogoutAttempt, authController.logout);

// Logout from all sessions
// todo implement logout
router.post('/logout-all', setLogoutFlag, logLogoutAttempt, verifyToken, verifySession, authController.logoutAll);
router.post("/forgot-password", authController.forgot);
router.post("/reset-password", authController.reset);

module.exports = router;