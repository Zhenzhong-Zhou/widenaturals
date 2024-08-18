const express = require('express');
const router = express.Router();
const tokenController = require("../controllers/tokenController");

router.get('/tokens/employee/:employeeId', tokenController.getTokens);

module.exports = router;