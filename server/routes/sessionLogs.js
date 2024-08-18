const express = require('express');
const router = express.Router();
const sessionLogController = require('../controllers/sessionLogController');

router.get('/sessions/employee/:employeeId', sessionLogController.getSessionLogs);

module.exports = router;