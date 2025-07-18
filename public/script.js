let pseudo = localStorage.getItem("pseudo") || "";
let avatar = localStorage.getItem("avatar") || "";

window.createProfile = function () {
  const input = document.getElementById("pseudoInput");
  const selected = document.getElementById("avatarSelect");
  if (!input || !selected) return alert("Élément manquant dans la page");

  const pseudoVal = input.value.trim();
  const avatarVal = selected.value;

  if (pseudoVal.length < 2) return alert("Pseudo trop court !");

  pseudo = pseudoVal;
  avatar = avatarVal;

  localStorage.setItem("pseudo", pseudo);
  localStorage.setItem("avatar", avatar);

  const currentUser = document.getElementById("currentUser");
  const modal = document.getElementById("profileModal");
  const app = document.querySelector(".app");
  if (currentUser) currentUser.textContent = `${avatar} ${pseudo}`;
  if (modal) modal.style.display = "none";
  if (app) app.style.display = "block";

  launchChat();
};

if (!pseudo || !avatar) {
  const modal = document.getElementById("profileModal");
  if (modal) modal.style.display = "flex";
} else {
  const currentUser = document.getElementById("currentUser");
  const app = document.querySelector(".app");
  if (currentUser) currentUser.textContent = `${avatar} ${pseudo}`;
  if (app) app.style.display = "block";
  launchChat();
}

function launchChat() {
  const ws = new WebSocket("ws://localhost:3000");
  window.ws = ws;

  const chatBox = document.getElementById("chatBox");
  const messageInput = document.getElementById("messageInput");
  const trustScoreDisplay = document.getElementById("trustScore");

  ws.onmessage = (event) => {
    const data = event.data;

    if (data.startsWith("[SCORE]:")) {
      const score = data.split(":")[1];
      if (trustScoreDisplay) trustScoreDisplay.textContent = `Trust Score: ${score}%`;
      return;
    }

    const msg = document.createElement("div");
    msg.textContent = data;
    if (chatBox) chatBox.appendChild(msg);
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

    if (data.startsWith("[MODÉRATION]")) {
      msg.style.color = "orange";
      alert("⚠️ Message bloqué par la modération IA.");
    }

    if (data.startsWith("[SYSTÈME] Ton compte a été suspendu")) {
      msg.style.color = "red";
      if (trustScoreDisplay) trustScoreDisplay.textContent = "Trust Score: 0%";
    }
  };

  window.sendMessage = () => {
    if (!messageInput) return;
    const message = messageInput.value.trim();
    if (message && pseudo && avatar) {
      const formatted = `${avatar} ${pseudo} : ${message}`;
      ws.send(formatted);
      messageInput.value = "";
    }
  };

  window.nextChat = () => {
    ws.close();
    location.reload();
  };
}
