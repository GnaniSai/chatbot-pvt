let textarea = document.querySelector("textarea");
textarea.addEventListener("keyup", (e) => {
  textarea.style.height = "45px";
  textarea.style.height = `${textarea.scrollHeight}px`;
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    button.click();
    textarea.style.height = "45px";
  }
});

let responseBox = document.querySelector(".response-box");
let button = document.querySelector("#submit");

let saveHistory = JSON.parse(localStorage.getItem("localdata")) || [];
let i = saveHistory.length + 1;
let j = 0;
const displayHistory = () => {
  const entries = saveHistory;
  entries.forEach((entry) => {
    let data = `<div class="responses" id = "response${entry.id}">
                <div class="user" id ="user${entry.id}">${entry.user}</div>
                <div class="ai-response" id ="ai-response${entry.id}">${entry.ai}</div>
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
    console.log(url);
  } else {
    proposal.style.backgroundColor = "#000000b4";
    proposal.style.color = "whitesmoke";
    url = "https://halo-ai.onrender.com/chat";
    console.log(url);
  }
  proposalActive = !proposalActive;
});

button.addEventListener("click", async (event) => {
  event.preventDefault();
  if (textarea.value.trim() === "") {
    textarea.placeholder = "Please type something";
  } else {
    let data = `<div class="responses" id = "response${i}">
                <div class="user" id ="user${i}"></div>
                <div class="ai-response" id ="ai-response${i}">
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
    document
      .querySelector(`#response${i}`)
      .scrollIntoView({ behavior: "smooth", block: "start" });
    textarea.placeholder = "Let's Chat";

    try {
      let response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: user.textContent }),
      });
      console.log(url);
      let aiResponse = await response.json();
      let updateAiResponse = document.querySelector(`#ai-response${i}`);
      if (url === "https://halo-ai.onrender.com/chat/proposal") {
        j++;
        updateAiResponse.innerHTML =
          aiResponse.message +
          `<div class = "mail-n-download"><a href="/download/proposal${j}.pdf" class = "download-btn" download><img src="icons/download.svg" alt="download"></a>
          <div class = "email-btn"><input type="email" placeholder="Enter your email" id="email${j}"/>
          <button type="button" id="send${j}"><img src="icons/mail.svg" alt="download"></button></div></div>`;
        console.log("J inside if else", j);

        let current = j;
        document
          .querySelector(`#send${current}`)
          .addEventListener("click", async () => {
            let email = document.querySelector(`#email${current}`).value.trim();
            let filename = `proposal${current}.pdf`;

            if (!email) {
              document.querySelector(`#email${current}`).placeholder =
                "Please enter a valid email";
              return;
            }

            let sendButton = document.querySelector(`#send${current} img`);
            sendButton.src = "icons/check.svg";

            await fetch("https://halo-ai.onrender.com/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, filename }),
            });

            sendButton.src = "icons/mail.svg";
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
  }
});

const clear = document.querySelector("#clear");
clear.addEventListener("click", (event) => {
  event.preventDefault();
  localStorage.clear();
  responseBox.innerHTML = "";
  saveHistory = [];
  i = 1;
});
