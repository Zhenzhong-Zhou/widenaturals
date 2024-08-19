const express = require('express');
const router = express.Router();
const systemMonitoringController = require('../controllers/systemMonitoringController');

router.get('/', systemMonitoringController.getSystemMonitoringData);

module.exports = router;