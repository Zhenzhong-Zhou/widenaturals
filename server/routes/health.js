const express = require('express');
const router = express.Router();
const healthController = require("../controllers/healthController");

router.get('/health-check', healthController.healthCheck);

module.exports = router;
