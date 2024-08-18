const express = require('express');
const router = express.Router();
const tokenLogController = require('../controllers/tokenLogController');

router.get('/token-logs/token/:tokenId', tokenLogController.getTokenLogs);

module.exports = router;