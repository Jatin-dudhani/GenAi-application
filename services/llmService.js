async function generateResponse(messages) {
  const response = await requestChatCompletion({
    messages,
    stream: false
  });

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("LLM response did not include message content");
  }

  return content;
}

async function streamResponse(messages) {
  return requestChatCompletion({
    messages,
    stream: true
  });
}

async function requestChatCompletion({
  messages,
  stream
}) {
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;

  if (!baseUrl || !model) {
    throw new Error("LLM_BASE_URL and LLM_MODEL must be configured");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      stream,
      messages
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `LLM request failed with ${response.status}: ${body}`
    );
  }

  return response;
}

module.exports = {
  generateResponse,
  streamResponse
};
