const express = require("express");

const router = express.Router();

const {
  generateResponse,
  streamResponse
} = require("../services/llmService");

const {
  createConversation,
  getConversation,
  touchConversation,
  updateConversationTitle
} = require("../services/chatStore");

const {
  clearSession
} = require("../storage/chatStore");

const MAX_MESSAGE_LENGTH = 20000;

function buildMessages(conversation) {
  const messages = [
    {
      role: "system",
      content: process.env.SYSTEM_PROMPT || "You are a helpful AI assistant."
    },
    ...conversation.messages
  ];

  return messages;
}

function getOrCreateConversation(conversationId) {
  if (conversationId) {
    return {
      id: conversationId,
      conversation: getConversation(conversationId),
      created: false
    };
  }

  const id = createConversation();

  return {
    id,
    conversation: getConversation(id),
    created: true
  };
}

function getMessageValidationError(message) {
  if (typeof message !== "string" || !message.trim()) {
    return "Message is required";
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return `Message must be ${MAX_MESSAGE_LENGTH} characters or less`;
  }

  return null;
}

function addUserMessage(conversation, conversationId, message) {
  const content = message.trim();

  conversation.messages.push({
    role: "user",
    content
  });

  updateConversationTitle(conversationId, content);
}

router.post("/", async (req, res) => {
  try {
    const {
      message,
      conversationId
    } = req.body;

    const validationError =
      getMessageValidationError(message);

    if (validationError) {
      return res.status(400).json({
        error: validationError
      });
    }

    const result =
      getOrCreateConversation(conversationId);

    if (!result.conversation) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    addUserMessage(
      result.conversation,
      result.id,
      message
    );

    const reply =
      await generateResponse(
        buildMessages(result.conversation)
      );

    result.conversation.messages.push({
      role: "assistant",
      content: reply
    });
    touchConversation(result.id);

    res.json({
      reply,
      conversationId: result.id,
      created: result.created
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to generate response"
    });
  }
});

router.post("/reset", (req, res) => {
  const {
    sessionId
  } = req.body;

  clearSession(sessionId);

  res.json({
    success: true
  });
});

router.post("/stream", async (req, res) => {
  let responseStarted = false;

  try {
    const {
      message,
      conversationId
    } = req.body;

    const validationError =
      getMessageValidationError(message);

    if (validationError) {
      return res.status(400).json({
        error: validationError
      });
    }

    const result =
      getOrCreateConversation(conversationId);

    if (!result.conversation) {
      return res.status(404).json({
        error: "Conversation not found"
      });
    }

    addUserMessage(
      result.conversation,
      result.id,
      message
    );

    const response =
      await streamResponse(
        buildMessages(result.conversation)
      );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Conversation-Id", result.id);

    responseStarted = true;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantReply = "";
    let parseBuffer = "";

    while (true) {
      const {
        done,
        value
      } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, {
        stream: true
      });

      res.write(chunk);

      parseBuffer += chunk;

      const lines = parseBuffer.split("\n");
      parseBuffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data:")) {
          continue;
        }

        const json = line.replace("data:", "").trim();

        if (json === "[DONE]") {
          continue;
        }

        try {
          const parsed = JSON.parse(json);
          const token =
            parsed?.choices?.[0]?.delta?.content;

          if (token) {
            assistantReply += token;
          }
        } catch {
          // Ignore partial or non-JSON event lines from compatible servers.
        }
      }
    }

    if (assistantReply) {
      result.conversation.messages.push({
        role: "assistant",
        content: assistantReply
      });
      touchConversation(result.id);
    }

    res.end();
  } catch (error) {
    console.error(error);

    if (responseStarted) {
      res.write(
        `event: error\ndata: ${JSON.stringify("Streaming failed")}\n\n`
      );
      return res.end();
    }

    res.status(500).json({
      error: "Streaming failed"
    });
  }
});

module.exports = router;
