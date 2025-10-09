const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");
const gameOverScreen = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");
const factDisplay = document.getElementById("fact-display");

let player, obstacles, orbs, backgroundMountains;
let gameSpeed, gravity, score, highScore, gameActive, newHigh;

const facts = [
  "The Cape Mountains are home to over 9,000 plant species!",
  "Table Mountain is one of the oldest mountains on Earth.",
  "Fynbos, a unique vegetation, grows only in the Cape region.",
  "Many Cape species are found nowhere else in the world.",
  "Conservation in the Cape is key to protecting biodiversity.",
];

highScore = parseInt(localStorage.getItem("capeHighScore")) || 0;

function resetGame() {
  player = {
    x: 150,
    y: canvas.height - 120,
    w: 60,
    h: 60,
    dy: 0,
    jumping: false,
    color: "#ffb347",
  };
  gravity = 1.2;
  obstacles = [];
  orbs = [];
  backgroundMountains = [];
  score = 0;
  gameSpeed = 6;
  gameActive = true;
  newHigh = false;

  for (let i = 0; i < 3; i++) {
    backgroundMountains.push({
      x: i * canvas.width,
      color: `hsl(${200 + i * 15}, 50%, ${60 + i * 10}%)`,
      height: canvas.height / (3 + i * 0.6),
      speed: 2 + i,
    });
  }
}

function drawGradientSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#b3e5fc");
  gradient.addColorStop(1, "#e1f5fe");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawMountains() {
  backgroundMountains.forEach((m) => {
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.moveTo(m.x, canvas.height);
    ctx.lineTo(m.x + canvas.width, canvas.height);
    ctx.lineTo(m.x + canvas.width / 2, canvas.height - m.height);
    ctx.closePath();
    ctx.fill();

    m.x -= m.speed;
    if (m.x + canvas.width < 0) m.x = canvas.width;
  });
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.roundRect(player.x, player.y, player.w, player.h, 15);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawObstacles() {
  ctx.fillStyle = "#6d4c41";
  obstacles.forEach((o) => {
    ctx.beginPath();
    ctx.roundRect(o.x, o.y, o.w, o.h, 8);
    ctx.fill();
    o.x -= gameSpeed;
  });
  obstacles = obstacles.filter((o) => o.x + o.w > 0);
  if (Math.random() < 0.02) {
    obstacles.push({
      x: canvas.width,
      y: canvas.height - 80,
      w: 60,
      h: 60,
    });
  }
}

function drawOrbs() {
  ctx.shadowColor = "rgba(255, 255, 100, 0.6)";
  ctx.shadowBlur = 15;
  orbs.forEach((orb) => {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 255, 120, 0.9)";
    ctx.arc(orb.x, orb.y, 15, 0, Math.PI * 2);
    ctx.fill();
    orb.x -= gameSpeed;
  });
  ctx.shadowBlur = 0;
  orbs = orbs.filter((orb) => orb.x + 15 > 0);

  if (Math.random() < 0.01) {
    orbs.push({
      x: canvas.width,
      y: canvas.height - 150 - Math.random() * 150,
    });
  }
}

function showFact() {
  const randomFact = facts[Math.floor(Math.random() * facts.length)];
  factDisplay.textContent = randomFact;
}

function detectCollisions() {
  obstacles.forEach((o) => {
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      endGame();
    }
  });

  orbs.forEach((orb, i) => {
    const dx = player.x + player.w / 2 - orb.x;
    const dy = player.y + player.h / 2 - orb.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 40) {
      showFact();
      orbs.splice(i, 1);
      score += 50; // bonus for collecting an orb
    }
  });
}

function drawScore() {
  ctx.fillStyle = "#000";
  ctx.font = "24px Trebuchet MS";
  ctx.fillText(`Score: ${score}`, 20, 40);
  ctx.fillText(`High Score: ${highScore}`, 20, 70);
  if (newHigh) {
    ctx.fillStyle = "#ff5722";
    ctx.fillText("New High Score!", 20, 100);
  }
}

function endGame() {
  gameActive = false;
  if (score > highScore) {
    highScore = score;
    newHigh = true;
    localStorage.setItem("capeHighScore", highScore);
  }
  canvas.style.display = "none";
  gameOverScreen.classList.remove("hidden");
}

function update() {
  if (!gameActive) return;

  drawGradientSky();
  drawMountains();
  drawObstacles();
  drawOrbs();
  drawPlayer();
  drawScore();

  player.y += player.dy;
  if (player.y + player.h < canvas.height - 60) {
    player.dy += gravity;
  } else {
    player.y = canvas.height - 120;
    player.dy = 0;
    player.jumping = false;
  }

  detectCollisions();

  score++;
  requestAnimationFrame(update);
}

function jump() {
  if (!player.jumping) {
    player.dy = -20;
    player.jumping = true;
  }
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

startButton.onclick = () => {
  startScreen.style.display = "none";
  canvas.style.display = "block";
  resetGame();
  update();
};

restartButton.onclick = () => {
  gameOverScreen.classList.add("hidden");
  canvas.style.display = "block";
  resetGame();
  update();
};

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") jump();
});
canvas.addEventListener("touchstart", jump);
