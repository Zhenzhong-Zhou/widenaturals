const express = require('express');
const router = express.Router();
const tokenController = require("../controllers/tokenController");

router.get('/', tokenController.getTokens);

module.exports = router;