async function generateResponse(messages) {
  const response = await fetch(
    `${process.env.LLM_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        messages
      })
    }
  );

  const data = await response.json();

  return data.choices[0].message.content;
}

module.exports = {
  generateResponse
};