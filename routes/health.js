const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    model: process.env.LLM_MODEL,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;