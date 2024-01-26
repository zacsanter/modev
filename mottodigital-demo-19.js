const typingIndicator = document.getElementById("typing-indicator");
const uniqueId = generateUniqueId();
const voiceflowRuntime = "general-runtime.voiceflow.com";
const voiceflowVersionID =
  document.getElementById("vfassistant").getAttribute("data-version") ||
  "production";

const voiceflowAPIKey = "VF.DM.650c4a1a7e1a04000744b6ea.GCmymdNkzCanFlqS"; 

const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("user-input");
const responseContainer = document.getElementById("response-container");
const inputPlaceholder = document.getElementById("input-placeholder");
const inputFieldContainer = document.getElementById("input-container");
const savedMessages = localStorage.getItem("messages");
const chatContainer = document.getElementById("chat-container");
const restartButton = document.getElementById("restart-button");

const assistantTag = "株式会社Mottodigital",
  userTag = "ユーザー";

(function() {
    // Wait for a brief moment to ensure all elements are loaded
    setTimeout(function() {
        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.click();
        } else {
            console.log('Restart button not found');
        }
    }, 50); // The delay in milliseconds (500ms in this case)
})();

function displayResponse(response) {
    setTimeout(() => {
        if (response) {
            response.forEach((item, index) => {
                // Delay each message by 500ms more than the previous one
                const delay = index * 750;

                setTimeout(() => {
                    if (item.type === "speak" || item.type === "text") {
                        console.info("Speak/Text Step");

                        const messageElement = document.createElement("div");
                        messageElement.classList.add("message", "assistant");

                        const paragraphs = item.payload.message.split("\n\n");
                        const wrappedMessage = paragraphs
                            .map((para) => `<p>${para}</p>`)
                            .join("");

                        messageElement.innerHTML = wrappedMessage;
                        addAssistantMsg(messageElement);

                    } else if (item.type === "choice") {
                        const buttonContainer = document.createElement("div");
                        buttonContainer.classList.add("buttoncontainer");

                        item.payload.buttons.forEach((button) => {
                            const buttonElement = document.createElement("button");
                            buttonElement.classList.add("assistant", "message", "button");
                            buttonElement.textContent = button.name;
                            buttonElement.dataset.key = button.request.type;
                            buttonElement.addEventListener("click", (event) => {
                                handleButtonClick(event);
                            });
                            buttonContainer.appendChild(buttonElement);
                        });
                        chatWindow.appendChild(buttonContainer);
                        localStorage.setItem("messages", chatWindow.innerHTML);

                    } else if (item.type === "visual") {
                        console.info("Image Step");

                        const imageElement = document.createElement("img");
                        imageElement.src = item.payload.image;
                        imageElement.alt = "Assistant Image";
                        imageElement.style.width = "100%";

                        addAssistantMsg(imageElement);
                    }

                    // Update chat window scroll after each message
                    chatWindow.scrollTop = chatWindow.scrollHeight;

                }, delay); // This delay ensures that each message is added with a gap of 500ms
            });
        }

        typingIndicator.classList.add("hidden");

        // Ensuring the response container and input field are handled after all messages
        setTimeout(() => {
            responseContainer.style.opacity = "1";

            input.disabled = false;
            input.value = "";
            input.classList.remove("fade-out");
            input.blur();
            input.focus();
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }, response.length * 500);

    }, 250); // Initial delay before starting to append messages
}




document.addEventListener("DOMContentLoaded", (event) => {
  // Generate a unique ID for the user

  // Set chat-container height to viewport height
  chatContainer.style.height = `${window.innerHeight}px`;

  // Only call interact('#launch#') if there are no saved messages
  if (!savedMessages) {
    interact("#launch#");
  }

  // Load messages from local storage
  if (savedMessages) {
    chatWindow.innerHTML = savedMessages;
    if (typingIndicator) {
      typingIndicator.style.display = "none"; // or typingIndicator.classList.add('hidden');
    }
  }

  restartButton.addEventListener("click", () => {
    chatWindow.innerHTML = "";
    localStorage.removeItem("messages");

    var locationContainer = document.getElementById("location-container");
    if (locationContainer) {
      locationContainer.style.display = "none";
      document.body.insertBefore(locationContainer, document.body.firstChild);
    }

    interact("#launch#");
  });
  inputFieldContainer.addEventListener("click", () => {
    input.focus();
  });
  // Hide placeholder on input focus
  input.addEventListener("focus", () => {
    input.style.caretColor = "transparent";
  });
  // Restore placeholder on input blur
  input.addEventListener("blur", () => {
    input.style.caretColor = "white";
  });

  // Send user input to Voiceflow Dialog API
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      const userInput = input.value.trim();

      if (userInput) {
        // Disable input field and apply fade-out animation
        input.disabled = true;
        input.classList.add("fade-out");

        // Fade out previous content
        responseContainer.style.opacity = "0";

       

        addUserMsg(userInput);
        
     

        // Scroll to the bottom of the chat window
        window.requestAnimationFrame(() => {
          setTimeout(() => {
            chatWindow.scrollTop = chatWindow.scrollHeight;
          }, 100); // A 100ms delay, which you can adjust as needed.
        });

        // Show typing indicator
        typingIndicator.classList.remove("hidden");
        chatWindow.appendChild(typingIndicator);

        interact({ type: "text", payload: userInput });
      }
    }
  });


});
// Function to generate a unique ID for the user
function generateUniqueId() {
  // generate a random string of 6 characters
  const randomStr = Math.random().toString(36).substring(2, 8);
  // get the current date and time as a string
  const dateTimeStr = new Date().toISOString();
  // remove the separators and milliseconds from the date and time string
  const dateTimeStrWithoutSeparators = dateTimeStr
    .replace(/[-:]/g, "")
    .replace(/\.\d+/g, "");
  // concatenate the random string and date and time string
  const uniqueId = randomStr + dateTimeStrWithoutSeparators;
  return uniqueId;
}

async function interact(action) {
  // Show the typing indicator before sending the message
  if (typingIndicator) {
    typingIndicator.style.display = "flex";
  }


  let body = {
    config: { tts: true, stripSSML: true },
    action: action,
  };
 
  // If input is #launch# > Use a launch action to the request body
  if (action == "#launch#") {
    body = {
      config: { tts: true, stripSSML: true },
      action: { type: "launch" },
    };
  }

  fetch(`https://${voiceflowRuntime}/state/user/${uniqueId}/interact/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: voiceflowAPIKey,
      versionID: voiceflowVersionID,
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((data) => {
      displayResponse(data);
    })
    .catch((err) => {
      displayResponse(null);
    });
}

function handleButtonClick(event) {


  addUserMsg(event.target.textContent);
  let body = { request: { type: event.target.dataset.key } };
  event.target.parentElement.remove();
  fetch(`https://${voiceflowRuntime}/state/user/${uniqueId}/interact/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: voiceflowAPIKey,
      versionID: voiceflowVersionID,
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((data) => {
      displayResponse(data);
    })
    .catch((err) => {
      // console.error(err)
      displayResponse(null);
    });
 
}

function updateVariable(variable, value) {
  return new Promise(async (resolve, reject) => {
    let data = {};
    data[variable] = value;
    await fetch(
      `https://${voiceflowRuntime}/state/user/${uniqueId}/variables/`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
          authorization: voiceflowAPIKey,
          "content-type": "application/json",
        },
      }
    );

    resolve(data.conversations);
  });
}

function addAssistantMsg(element) {
  const assistantTagLine = document.createElement("div");
  assistantTagLine.classList.add("assistanttagline");
  assistantTagLine.textContent = assistantTag;

  const assistantImage = document.createElement("div");
  assistantImage.classList.add("assistantimage");

  const assistantWrapper = document.createElement("div");
  assistantWrapper.classList.add("assistantwrapper");
  assistantWrapper.appendChild(assistantImage);
  assistantWrapper.appendChild(element);

  const assistantMsg = document.createElement("div");
  assistantMsg.classList.add("assistantMsg");
  assistantMsg.appendChild(assistantTagLine);
  assistantMsg.appendChild(assistantWrapper);

  chatWindow.appendChild(assistantMsg);
  localStorage.setItem("messages", chatWindow.innerHTML);
}

function addUserMsg(userInput) {
  const userTagLine = document.createElement("div");
  userTagLine.classList.add("usertagline");
  userTagLine.textContent = userTag;

  const userImage = document.createElement("div");
  userImage.classList.add("userimage");
  const userMessageElement = document.createElement("div");
  userMessageElement.classList.add("message", "user");
  userMessageElement.textContent = userInput;

  const userWrapper = document.createElement("div");
  userWrapper.classList.add("userwrapper");
  userWrapper.appendChild(userImage);
  userWrapper.appendChild(userMessageElement);

  const userMsg = document.createElement("div");
  userMsg.classList.add("userMsg");
  userMsg.appendChild(userTagLine);
  userMsg.appendChild(userWrapper);

  chatWindow.appendChild(userMsg);
  localStorage.setItem("messages", chatWindow.innerHTML);
}
