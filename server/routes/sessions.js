const express = require('express');
const router = express.Router();
const sessionController = require("../controllers/sessionController");

router.get('/sessions/employee/:employeeId', sessionController.getSessions);

module.exports = router;