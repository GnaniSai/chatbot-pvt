let textarea = document.querySelector("textarea");
let responseBox = document.querySelector(".response-box");
let button = document.querySelector("#submit");

let saveHistory = JSON.parse(localStorage.getItem("localdata")) || [];
let i = saveHistory.length + 1;
let j = 0;

textarea.addEventListener("keyup", (e) => {
  textarea.style.height = "45px";
  textarea.style.height = `${textarea.scrollHeight}px`;
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    button.click();
    textarea.style.height = "45px";
  }
});

const displayHistory = () => {
  const entries = saveHistory;
  entries.forEach((entry) => {
    let data = `<div class="responses" id="response${entry.id}">
                  <div class="user" id="user${entry.id}">${entry.user}</div>
                  <div class="ai-response" id="ai-response${entry.id}">${entry.ai}</div>
                </div>`;
    responseBox.insertAdjacentHTML("beforeend", data);
  });
};
displayHistory();

let url = "https://halo-ai.onrender.com/chat";
const proposal = document.querySelector("#proposal");
let proposalActive = false;

proposal.addEventListener("click", () => {
  if (!proposalActive) {
    proposal.style.backgroundColor = "white";
    proposal.style.color = "black";
    url = "https://halo-ai.onrender.com/chat/proposal";
  } else {
    proposal.style.backgroundColor = "#000000b4";
    proposal.style.color = "whitesmoke";
    url = "https://halo-ai.onrender.com/chat";
  }
  proposalActive = !proposalActive;
});

button.addEventListener("click", async (event) => {
  event.preventDefault();
  if (textarea.value.trim() === "") {
    textarea.placeholder = "Please type something";
    return;
  }

  let data = `<div class="responses" id="response${i}">
                <div class="user" id="user${i}"></div>
                <div class="ai-response" id="ai-response${i}">
                  <div class="loading"></div>
                </div>
              </div>`;
  responseBox.insertAdjacentHTML("beforeend", data);
  button.disabled = true;
  button.style.cursor = "not-allowed";

  let user = document.querySelector(`#user${i}`);
  user.textContent = textarea.value;

  textarea.value = "";
  textarea.style.height = "auto";
  textarea.placeholder = "Let's Chat";

  document
    .querySelector(`#response${i}`)
    .scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userPrompt: user.textContent }),
    });

    let aiResponse = await response.json();
    let updateAiResponse = document.querySelector(`#ai-response${i}`);
    if (url === "https://halo-ai.onrender.com/chat/proposal") {
      j++;
      updateAiResponse.innerHTML = `
  <div class="proposal-wrapper">
    <div class="proposal-text">${aiResponse.message}</div>
    <div class="mail-n-download">
      <button class="download-btn" id="download${j}" title="Download PDF">
        <img src="icons/download.svg" alt="download" />
      </button>
      <div class="email-btn">
        <input type="email" placeholder="Enter your email" id="email${j}" />
        <button type="button" id="send${j}">
          <img src="icons/mail.svg" alt="mail" />
        </button>
      </div>
    </div>
  </div>
`;

      const current = j;

      document
        .querySelector(`#send${current}`)
        .addEventListener("click", async (e) => {
          let email = document.querySelector(`#email${current}`).value.trim();
          const proposalText = e.target
            .closest(".proposal-wrapper")
            .querySelector(".proposal-text").innerText;

          if (!email) {
            document.querySelector(`#email${current}`).placeholder =
              "Please enter a valid email";
            return;
          }

          let sendIcon = document.querySelector(`#send${current} img`);
          sendIcon.src = "icons/check.svg";

          await fetch("https://halo-ai.onrender.com/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, proposalText }),
          });

          sendIcon.src = "icons/mail.svg";
        });

      document
        .querySelector(`#download${current}`)
        .addEventListener("click", async (e) => {
          const proposalText = e.target
            .closest(".proposal-wrapper")
            .querySelector(".proposal-text").innerText;

          const response = await fetch(
            "https://halo-ai.onrender.com/generate-pdf",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ proposalText }),
            }
          );

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "proposal.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
    } else {
      updateAiResponse.innerHTML = aiResponse.message;
    }

    document
      .querySelector(`#response${i}`)
      .scrollIntoView({ behavior: "smooth", block: "start" });

    saveHistory.push({
      id: i,
      user: user.textContent,
      ai: aiResponse.message,
    });
    localStorage.setItem("localdata", JSON.stringify(saveHistory));
  } catch (error) {
    console.log("Error: ", error);
  }

  button.disabled = false;
  button.style.cursor = "pointer";
  i++;
});

const clear = document.querySelector("#clear");
clear.addEventListener("click", (event) => {
  event.preventDefault();
  localStorage.clear();
  responseBox.innerHTML = "";
  saveHistory = [];
  i = 1;
});
