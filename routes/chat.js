const {
  clearSession
} = require("../storage/chatStore");

const express = require("express");

const {
  generateResponse
} = require("../services/llmService");

const {
  getSession
} = require("../storage/chatStore");

const router = express.Router();

router.post("/", async (req, res) => {

  try {

    const {
      message,
      sessionId
    } = req.body;

    const history =
      getSession(sessionId);

    history.push({
      role: "user",
      content: message
    });

    const messages = [
      {
        role: "system",
        content:
          process.env.SYSTEM_PROMPT
      },
      ...history
    ];

    const reply =
      await generateResponse(messages);

    history.push({
      role: "assistant",
      content: reply
    });

    res.json({
      reply
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error:
        "Failed to generate response"
    });

  }

});

router.post("/reset", (req, res) => {

  const { sessionId } = req.body;

  clearSession(sessionId);

  res.json({
    success: true
  });

});



module.exports = router;