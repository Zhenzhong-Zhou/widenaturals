const express = require('express');
const welcome = require("../controllers/welcome");
const router = express.Router();

router.get("/", welcome);

module.exports = router;