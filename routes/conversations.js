const express = require("express");

const router = express.Router();

const {
  createConversation,
  getConversation,
  getAllConversations,
  touchConversation
} = require("../services/chatStore");

const MAX_MESSAGE_LENGTH = 20000;

router.get("/", (req, res) => {

  res.json(
    getAllConversations()
  );

});

router.post("/", (req, res) => {

  const id =
    createConversation();

  res.json({ id });

});

router.get("/:id", (req, res) => {

  const conversation =
    getConversation(
      req.params.id
    );

  if (!conversation) {

    return res
      .status(404)
      .json({
        error:
          "Conversation not found"
      });

  }

  res.json(conversation);

});

router.post(
  "/:id/message",
  (req, res) => {

    const conversation =
      getConversation(
        req.params.id
      );

    if (!conversation) {

      return res
        .status(404)
        .json({
          error:
            "Conversation not found"
        });

    }

    const {
      role,
      content
    } = req.body;

    if (
      !["user", "assistant"].includes(role) ||
      typeof content !== "string" ||
      !content.trim() ||
      content.length > MAX_MESSAGE_LENGTH
    ) {
      return res
        .status(400)
        .json({
          error:
            `Message requires role and content up to ${MAX_MESSAGE_LENGTH} characters`
        });
    }

    conversation.messages.push({
      role,
      content: content.trim()
    });
    touchConversation(req.params.id);

    res.json({
      success: true
    });

  }
);

module.exports = router;
