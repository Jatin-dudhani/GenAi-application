const crypto = require("crypto");
const conversations = new Map();

function createConversation() {

  const id =
    crypto.randomUUID();

  conversations.set(id, {
    id,
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  return id;
}

function getConversation(id) {

  return conversations.get(id);

}

function getAllConversations() {

  return Array.from(
    conversations.values()
  ).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
}

function touchConversation(id) {
  const conversation =
    conversations.get(id);

  if (conversation) {
    conversation.updatedAt = Date.now();
  }
}

function updateConversationTitle(
  id,
  firstMessage
) {

  const conversation =
    conversations.get(id);

  if (!conversation) return;

  if (
    conversation.title ===
    "New Chat"
  ) {

    conversation.title =
      firstMessage.length > 30
        ? firstMessage.slice(0, 30) + "..."
        : firstMessage;

  }

  touchConversation(id);

}

module.exports = {
  createConversation,
  getConversation,
  getAllConversations,
  updateConversationTitle,
  touchConversation
};
