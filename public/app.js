let sessionId =
  localStorage.getItem("sessionId");

if (!sessionId) {

  sessionId =
    crypto.randomUUID();

  localStorage.setItem(
    "sessionId",
    sessionId
  );
}

const messages =
  document.getElementById(
    "messages"
  );

function addMessage(
  text,
  role
){

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message";

  const bubble =
    document.createElement("div");

  bubble.className = role;

  bubble.textContent = text;

  wrapper.appendChild(
    bubble
  );

  messages.appendChild(
    wrapper
  );

  messages.scrollTop =
    messages.scrollHeight;
}

async function sendMessage(){

  const input =
    document.getElementById(
      "prompt"
    );

  const text =
    input.value.trim();

  if(!text) return;

  addMessage(
    text,
    "user"
  );

  input.value="";

  const typing =
    document.createElement("div");

  typing.id="typing";

  typing.className=
    "message";

  typing.innerHTML=
    "<div class='bot'>Thinking...</div>";

  messages.appendChild(
    typing
  );

  try{

    const response =
      await fetch(
        "/api/chat",
        {
          method:"POST",
          headers:{
            "Content-Type":
            "application/json"
          },
          body:JSON.stringify({
            message:text,
            sessionId
          })
        }
      );

    const data =
      await response.json();

    document
      .getElementById(
        "typing"
      )
      ?.remove();

    addMessage(
      data.reply,
      "bot"
    );

  }catch(err){

    document
      .getElementById(
        "typing"
      )
      ?.remove();

    addMessage(
      "Error contacting AI.",
      "bot"
    );
  }
}

function clearChat(){

  messages.innerHTML="";

  fetch(
    "/api/chat/reset",
    {
      method:"POST",
      headers:{
        "Content-Type":
        "application/json"
      },
      body:JSON.stringify({
        sessionId
      })
    }
  );
}

document
  .getElementById(
    "prompt"
  )
  .addEventListener(
    "keydown",
    e => {

      if(
        e.key==="Enter" &&
        !e.shiftKey
      ){
        e.preventDefault();
        sendMessage();
      }

    }
  );

  const promptBox =
  document.getElementById("prompt");

promptBox.addEventListener(
  "input",
  () => {
    promptBox.style.height = "auto";
    promptBox.style.height =
      promptBox.scrollHeight + "px";
  }
);