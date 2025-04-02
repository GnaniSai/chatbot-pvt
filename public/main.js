let textarea = document.querySelector("textarea");
textarea.addEventListener("keyup", (e) => {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
});

let userTextBox = document.querySelector("#userTextBox");
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

let url = "http://localhost:5000/chat";
const proposal = document.querySelector("#proposal");
let proposalActive = false;
proposal.addEventListener("click", () => {
  if (!proposalActive) {
    proposal.style.backgroundColor = "white";
    proposal.style.color = "black";
    url = "http://localhost:5000/chat/proposal";
    console.log(url);
  } else {
    proposal.style.backgroundColor = "black";
    proposal.style.color = "whitesmoke";
    url = "http://localhost:5000/chat";
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
      if(url === "http://localhost:5000/chat/proposal"){
        updateAiResponse.innerHTML =
        `<div><a href="/download/proposal${i}.pdf" download>Download</a></div>`+ aiResponse.message;
      }else{
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
      i++;
    } catch (error) {
      console.log("Error: ", error);
    }
    button.disabled = false;
    button.style.cursor = "pointer";
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

