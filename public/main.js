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

let url = "http://localhost:3000/chat";
const proposal = document.querySelector("#proposal");
let proposalActive = false;
proposal.addEventListener("click", () => {
  if (!proposalActive) {
    proposal.style.backgroundColor = "white";
    proposal.style.color = "black";
    url = "http://localhost:3000/chat/proposal";
    console.log(url);
  } else {
    proposal.style.backgroundColor = "#000000b4";
    proposal.style.color = "whitesmoke";
    url = "http://localhost:3000/chat";
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
      if (url === "http://localhost:3000/chat/proposal") {
        updateAiResponse.innerHTML = aiResponse.message +
          `<div class = "mail-n-download"><a href="/download/proposal${i}.pdf" class = "download-btn" download><img src="assets/icons/download.svg" alt="download"></a>
          <div class = "email-btn"><input type="email" placeholder="Enter your email" id="email${i}"/>  
          <button type="button" id="send${i}"><img src="assets/icons/mail.svg" alt="download"></button></div></div>`;
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
      console.log("this is LS down",i);
      let currentID = i
      const sendEmail = document.querySelector(`#send${i}`);
      sendEmail.addEventListener("click", async (event) => {
        event.preventDefault();
        sendEmail.querySelector("img").src = "assets/icons/check.svg"
        const email = document.querySelector(`#email${currentID}`).value;
        console.log(email);
        let filename = `proposal${currentID}.pdf`;
        console.log(filename);
        await fetch("http://localhost:3000/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, filename: filename }),
        });

      sendEmail.querySelector("img").src = "assets/icons/mail.svg"
      });
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