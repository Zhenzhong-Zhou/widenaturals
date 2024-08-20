const express = require('express');
const router = express.Router();
const systemMonitoringController = require('../controllers/systemMonitoringController');
const authorize = require("../middlewares/authorize");
const {validateSystemMonitorQuery} = require("../middlewares/validateSystemMonitorFields");

router.get('/', authorize(['admin_access'], false), validateSystemMonitorQuery, systemMonitoringController.getSystemMonitoringData);

module.exports = router;