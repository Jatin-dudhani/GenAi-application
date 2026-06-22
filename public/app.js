let sessionId = localStorage.getItem("sessionId");

if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("sessionId", sessionId);
}

let currentConversationId = null;

const chatList = document.getElementById("chatList");
const newChatButton = document.getElementById("newChat");
const messages = document.getElementById("messages");
const promptBox = document.getElementById("prompt");
const sendButton = document.getElementById("sendBtn");
const codePanel = document.getElementById("codePanel");
const codeList = document.getElementById("codeList");
const copyAllCodeButton = document.getElementById("copyAllCode");

let conversationCodeSnippets = [];
let currentCodeSnippets = [];

function normalizeRole(role) {
  return role === "assistant" ? "bot" : role;
}

function renderMarkdown(text) {
  return DOMPurify.sanitize(
    marked.parse(text)
  );
}

function setBotContent(bubble, text) {
  if (!window.marked || !window.DOMPurify) {
    bubble.textContent = text;
    return;
  }

  bubble.innerHTML = renderMarkdown(text);
  addCopyButtons(bubble);
}

function extractCodeBlocks(markdown) {
  const blocks = [];
  const pattern = /```([^\n`]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = pattern.exec(markdown)) !== null) {
    const language = match[1].trim() || "text";
    const code = match[2].replace(/\n$/, "");

    if (code.trim()) {
      blocks.push({
        language,
        code
      });
    }
  }

  return blocks;
}

function getExtension(language) {
  const normalized = language.toLowerCase();

  const extensions = {
    bash: "sh",
    csharp: "cs",
    css: "css",
    html: "html",
    javascript: "js",
    js: "js",
    json: "json",
    jsx: "jsx",
    markdown: "md",
    md: "md",
    powershell: "ps1",
    py: "py",
    python: "py",
    sh: "sh",
    ts: "ts",
    tsx: "tsx",
    typescript: "ts",
    yaml: "yml",
    yml: "yml"
  };

  return extensions[normalized] || "txt";
}

function getCodeSnippetsFromMessages(chatMessages) {
  return chatMessages
    .filter(message => normalizeRole(message.role) === "bot")
    .flatMap(message => extractCodeBlocks(message.content));
}

function copyText(text, button) {
  navigator.clipboard.writeText(text);

  if (!button) return;

  const originalText = button.textContent;
  button.textContent = "Copied!";

  setTimeout(() => {
    button.textContent = originalText;
  }, 1800);
}

function downloadSnippet(snippet, index) {
  const extension = getExtension(snippet.language);
  const blob = new Blob([snippet.code], {
    type: "text/plain"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `snippet-${index + 1}.${extension}`;
  link.click();

  URL.revokeObjectURL(url);
}

function renderCodePanel(snippets) {
  currentCodeSnippets = snippets;
  codeList.replaceChildren();

  if (!snippets.length) {
    codePanel.hidden = true;
    return;
  }

  codePanel.hidden = false;

  snippets.forEach((snippet, index) => {
    const card = document.createElement("article");
    const header = document.createElement("div");
    const title = document.createElement("div");
    const actions = document.createElement("div");
    const copyButton = document.createElement("button");
    const downloadButton = document.createElement("button");
    const pre = document.createElement("pre");
    const code = document.createElement("code");

    card.className = "code-card";
    header.className = "code-card-header";
    title.className = "code-card-title";
    actions.className = "code-actions";
    copyButton.className = "panel-button";
    downloadButton.className = "panel-button";

    copyButton.type = "button";
    downloadButton.type = "button";
    copyButton.textContent = "Copy";
    downloadButton.textContent = "Download";
    title.textContent = `${snippet.language} snippet ${index + 1}`;
    code.className = `language-${snippet.language}`;
    code.textContent = snippet.code;

    copyButton.addEventListener("click", () => {
      copyText(snippet.code, copyButton);
    });

    downloadButton.addEventListener("click", () => {
      downloadSnippet(snippet, index);
    });

    actions.append(copyButton, downloadButton);
    header.append(title, actions);
    pre.appendChild(code);
    card.append(header, pre);
    codeList.appendChild(card);

    if (window.hljs) {
      hljs.highlightElement(code);
    }
  });
}

function addCopyButtons(container) {
  container
    .querySelectorAll("pre code")
    .forEach(block => {
      if (window.hljs && !block.dataset.highlighted) {
        hljs.highlightElement(block);
      }

      const pre = block.parentElement;

      if (pre.querySelector(".copy-code")) {
        return;
      }

      const button = document.createElement("button");

      button.className = "copy-code";
      button.type = "button";
      button.textContent = "Copy";

      button.addEventListener("click", () => {
        copyText(block.innerText, button);
      });

      pre.prepend(button);
    });
}

function addMessage(text, role) {
  const wrapper = document.createElement("div");
  const bubble = document.createElement("div");
  const className = normalizeRole(role);

  wrapper.className = "message";
  bubble.className = className;

  if (className === "bot") {
    setBotContent(bubble, text);
  } else {
    bubble.textContent = text;
  }

  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);

  messages.scrollTop = messages.scrollHeight;

  return bubble;
}

function showWelcome() {
  const welcome = document.createElement("div");
  const title = document.createElement("h1");
  const subtitle = document.createElement("p");

  welcome.className = "welcome";
  title.textContent = "SmolLM2";
  subtitle.textContent = "How can I help you today?";

  welcome.append(title, subtitle);
  messages.replaceChildren(welcome);
}

async function createConversation() {
  const response = await fetch("/api/conversations", {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Failed to create chat: ${response.status}`);
  }

  const data = await response.json();
  return data.id;
}

async function ensureConversation() {
  if (currentConversationId) {
    return currentConversationId;
  }

  currentConversationId = await createConversation();
  await loadChats();
  await openChat(currentConversationId);

  return currentConversationId;
}

async function sendMessage() {
  const text = promptBox.value.trim();

  if (!text) return;

  try {
    await ensureConversation();

    addMessage(text, "user");

    promptBox.value = "";
    promptBox.style.height = "auto";

    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        sessionId,
        conversationId: currentConversationId
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API failed: ${response.status}`);
    }

    currentConversationId =
      response.headers.get("X-Conversation-Id") || currentConversationId;

    const bubble = addMessage("", "bot");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";

    while (true) {
      const {
        done,
        value
      } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true
      });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

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
          const token = parsed?.choices?.[0]?.delta?.content;

          if (token) {
            fullResponse += token;
            setBotContent(bubble, fullResponse);
            renderCodePanel([
              ...conversationCodeSnippets,
              ...extractCodeBlocks(fullResponse)
            ]);
            messages.scrollTop = messages.scrollHeight;
          }
        } catch {
          // Compatible servers may emit comments or incomplete event lines.
        }
      }
    }

    await loadChats();
    conversationCodeSnippets = [
      ...conversationCodeSnippets,
      ...extractCodeBlocks(fullResponse)
    ];
    renderCodePanel(conversationCodeSnippets);
  } catch (error) {
    console.error(error);
    addMessage("Error contacting AI.", "bot");
  }
}

function clearChat() {
  showWelcome();
  conversationCodeSnippets = [];
  renderCodePanel([]);

  fetch("/api/chat/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId
    })
  });
}

async function loadChats() {
  const response = await fetch("/api/conversations");

  if (!response.ok) {
    throw new Error(`Failed to load chats: ${response.status}`);
  }

  const chats = await response.json();
  renderChats(chats);

  return chats;
}

function renderChats(chats) {
  chatList.replaceChildren();

  chats.forEach(chat => {
    const item = document.createElement("button");

    item.className =
      chat.id === currentConversationId
        ? "chat-item active"
        : "chat-item";
    item.type = "button";
    item.textContent = chat.title;

    item.addEventListener("click", () => {
      openChat(chat.id);
    });

    chatList.appendChild(item);
  });
}

async function openChat(id) {
  const response = await fetch(`/api/conversations/${id}`);

  if (!response.ok) {
    console.error("Conversation not found");
    return;
  }

  const conversation = await response.json();

  currentConversationId = id;
  messages.replaceChildren();
  conversationCodeSnippets =
    getCodeSnippetsFromMessages(conversation.messages);
  renderCodePanel(conversationCodeSnippets);

  if (!conversation.messages.length) {
    showWelcome();
  } else {
    conversation.messages.forEach(msg => {
      addMessage(msg.content, msg.role);
    });
  }

  await loadChats();
}

newChatButton.addEventListener("click", async () => {
  try {
    currentConversationId = await createConversation();
    await loadChats();
    await openChat(currentConversationId);
    promptBox.focus();
  } catch (error) {
    console.error(error);
    addMessage("Could not create a new chat.", "bot");
  }
});

sendButton.addEventListener("click", () => {
  sendMessage();
});

promptBox.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

copyAllCodeButton.addEventListener("click", () => {
  const allCode = currentCodeSnippets
    .map(snippet => snippet.code)
    .join("\n\n");

  copyText(allCode, copyAllCodeButton);
});

promptBox.addEventListener("input", () => {
  promptBox.style.height = "auto";
  promptBox.style.height = `${promptBox.scrollHeight}px`;
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const chats = await loadChats();

    currentConversationId =
      chats[0]?.id || await createConversation();

    await openChat(currentConversationId);
  } catch (error) {
    console.error(error);
    addMessage("Could not load chats.", "bot");
  }
});
