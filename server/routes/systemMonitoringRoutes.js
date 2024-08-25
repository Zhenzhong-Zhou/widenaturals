const express = require('express');
const router = express.Router();
const systemMonitoringController = require('../controllers/systemMonitoringController');
const authorize = require("../middlewares/auth/authorize");
const {validateSystemMonitorQuery} = require("../middlewares/validation/validateSystemMonitorFields");

router.post('/', authorize(['admin_access'], false), validateSystemMonitorQuery, systemMonitoringController.getSystemMonitoringData);

module.exports = router;