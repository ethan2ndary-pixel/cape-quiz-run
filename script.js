// === Setup ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// === Elements ===
const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const quizPopup = document.getElementById("quiz-popup");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");
const saveScoreButton = document.getElementById("save-score");
const restartButton = document.getElementById("restart");
const playerNameInput = document.getElementById("player-name");
const scoreList = document.getElementById("score-list");

// === Game Variables ===
let player, spikes, orbs, gravity, jumpPower, gameSpeed, score, quizActive, gameRunning;

// === Background Image ===
const backgroundImg = new Image();
backgroundImg.src = "https://upload.wikimedia.org/wikipedia/commons/2/25/Table_Mountain_from_Bloubergstrand.jpg";

// === Local High Scores ===
let highScores = JSON.parse(localStorage.getItem("capeHighScores")) || [];

// === Player Object ===
function createPlayer() {
  return {
    x: 150,
    y: canvas.height - 100,
    width: 50,
    height: 80,
    vy: 0,
    color: "#222",
    jumping: false,
  };
}

// === Reset Game ===
function resetGame() {
  player = createPlayer();
  spikes = [];
  orbs = [];
  gravity = 0.4; // low-gravity feel
  jumpPower = -10;
  gameSpeed = 6;
  score = 0;
  quizActive = false;
  gameRunning = true;
  gameLoop();
}

// === Controls ===
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !quizActive && gameRunning) jump();
});
window.addEventListener("touchstart", () => {
  if (!quizActive && gameRunning) jump();
});

// === Jump ===
function jump() {
  if (!player.jumping) {
    player.vy = jumpPower;
    player.jumping = true;
  }
}

// === Obstacles & Collectibles ===
function spawnSpike() {
  spikes.push({
    x: canvas.width,
    y: canvas.height - 60,
    width: 40,
    height: 60,
    color: "#654321",
  });
}

function spawnOrb() {
  orbs.push({
    x: canvas.width,
    y: canvas.height - 120,
    radius: 20,
    color: "gold",
  });
}

// === Questions ===
const questions = [
  {
    q: "Which city is closest to Table Mountain?",
    options: ["Cape Town", "Johannesburg", "Durban", "Pretoria"],
    answer: 0,
  },
  {
    q: "What type of rock mainly makes up Table Mountain?",
    options: ["Granite", "Sandstone", "Limestone", "Basalt"],
    answer: 1,
  },
  {
    q: "The Cape Floristic Region is famous for its:",
    options: ["Deserts", "Rainforests", "Fynbos", "Savannas"],
    answer: 2,
  },
];

// === Game Loop ===
function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, -score * 0.5, 0, canvas.width * 2, canvas.height);

  // Gravity
  player.y += player.vy;
  player.vy += gravity;

  if (player.y > canvas.height - 100) {
    player.y = canvas.height - 100;
    player.vy = 0;
    player.jumping = false;
  }

  // Player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y - player.height, player.width, player.height);

  // Spikes
  if (Math.random() < 0.01) spawnSpike();
  spikes.forEach((spike, i) => {
    spike.x -= gameSpeed;
    ctx.beginPath();
    ctx.moveTo(spike.x, spike.y);
    ctx.lineTo(spike.x + spike.width / 2, spike.y - spike.height);
    ctx.lineTo(spike.x + spike.width, spike.y);
    ctx.closePath();
    ctx.fillStyle = spike.color;
    ctx.fill();
    if (spike.x + spike.width < 0) spikes.splice(i, 1);

    if (
      player.x < spike.x + spike.width &&
      player.x + player.width > spike.x &&
      player.y > spike.y - spike.height
    ) {
      endGame();
    }
  });

  // Orbs
  if (Math.random() < 0.005) spawnOrb();
  orbs.forEach((orb, i) => {
    orb.x -= gameSpeed;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fillStyle = orb.color;
    ctx.fill();
    if (orb.x + orb.radius < 0) orbs.splice(i, 1);

    if (
      player.x < orb.x + orb.radius &&
      player.x + player.width > orb.x - orb.radius &&
      player.y - player.height < orb.y + orb.radius &&
      player.y > orb.y - orb.radius
    ) {
      orbs.splice(i, 1);
      showQuestion();
    }
  });

  // Score
  score += 1;
  if (score % 500 === 0) gameSpeed += 0.5;

  ctx.fillStyle = "black";
  ctx.font = "24px Trebuchet MS";
  ctx.fillText("Score: " + score, 20, 40);

  if (!quizActive) requestAnimationFrame(gameLoop);
}

// === Quiz Popup ===
function showQuestion() {
  quizActive = true;
  const q = questions[Math.floor(Math.random() * questions.length)];
  quizQuestion.textContent = q.q;
  quizOptions.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => {
      if (i === q.answer) score += 100;
      quizPopup.classList.add("hidden");
      quizActive = false;
      gameLoop();
    };
    quizOptions.appendChild(btn);
  });
  quizPopup.classList.remove("hidden");
}

// === End Game ===
function endGame() {
  gameRunning = false;
  canvas.style.display = "none";
  gameOverScreen.classList.remove("hidden");
  gameOverScreen.classList.add("show");
  finalScore.textContent = `Your Score: ${score}`;
}

// === Save Score ===
saveScoreButton.onclick = () => {
  const name = playerNameInput.value.trim() || "Player";
  highScores.push({ name, score });
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 5);
  localStorage.setItem("capeHighScores", JSON.stringify(highScores));
  location.reload();
};

// === Start & Restart ===
startButton.onclick = () => {
  startScreen.style.display = "none";
  canvas.style.display = "block";
  resetGame();
};

restartButton.onclick = () => {
  gameOverScreen.classList.add("hidden");
  canvas.style.display = "block";
  resetGame();
};

// === Show Saved Scores ===
function showHighScores() {
  scoreList.innerHTML = "";
  highScores.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = `${s.name}: ${s.score}`;
    scoreList.appendChild(li);
  });
}
showHighScores();
