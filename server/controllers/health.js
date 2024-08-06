const asyncHandler = require("../middlewares/asyncHandler");
const db = require("../database/database");

const health = asyncHandler(async (req, res) => {
    const health = await db.checkHealth();
    res.status(health.status === 'UP' ? 200 : 500).json(health);
});

module.exports = health;