const express = require('express');
const router = express.Router();
const loginHistoryController = require("../controllers/loginHistoryController");

router.get('/', loginHistoryController.getLoginHistory);

module.exports = router;