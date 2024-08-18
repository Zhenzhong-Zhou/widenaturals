const express = require('express');
const router = express.Router();
const loginHistoryController = require("../controllers/loginHistoryController");

router.get('/login-history/employee/:employeeId', loginHistoryController.getLoginHistory);
router.get('/login-history', loginHistoryController.getAllLoginHistory);

module.exports = router;