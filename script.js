const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Screens
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalPoints = document.getElementById('finalPoints');
const restartBtn = document.getElementById('restartBtn');
const quizOverlay = document.getElementById('quizOverlay');
const questionText = document.getElementById('questionText');
const choicesContainer = document.getElementById('choicesContainer');
const wrongOverlay = document.getElementById('wrongOverlay');
const wrongText = document.getElementById('wrongText');
const continueBtn = document.getElementById('continueBtn');

let player, obstacles, obstacleSpeed, points, questionIndex, gamePaused, gameStarted;

// Questions
let questions = [
  {
    question: "What is an NC cape?",
    answer: "A cape is a piece of land that extends into a body of water",
    choices: [
      "A cape is a piece of land that extends into a body of water",
      "A type of clothing worn by superheroes",
      "A small mountain or hill",
      "A type of ship used for trade"
    ]
  },
  {
    question: "What are the characteristics of a cape?",
    answer: "Smaller in size, rather pointed, steep cliffs",
    choices: [
      "Smaller in size, rather pointed, steep cliffs",
      "Flat and wide with gentle slopes",
      "Covered mostly in forests",
      "Always found near deserts"
    ]
  },
  {
    question: "How are capes formed?",
    answer: "Capes are formed by erosion",
    choices: [
      "Capes are formed by erosion",
      "Capes are formed by volcanic eruptions",
      "Capes are formed by earthquakes",
      "Capes are formed by human construction"
    ]
  },
  {
    question: "What is the ecological importance of capes?",
    answer: "Capes are coastal promontories that serve as ecological hot spots, providing a variety of critical ecosystem services.",
    choices: [
      "Capes are coastal promontories that serve as ecological hot spots, providing a variety of critical ecosystem services.",
      "Capes have no ecological importance.",
      "Capes are used only for shipping and trade routes.",
      "Capes are man-made structures for flood control."
    ]
  },
  {
    question: "When were capes discovered?",
    answer: "The capes were discovered in 1488 by a Portuguese navigator.",
    choices: [
      "The capes were discovered in 1488 by a Portuguese navigator.",
      "The capes were discovered in 1600 by a Spanish explorer.",
      "The capes were discovered in 1200 by a British sailor.",
      "The capes were discovered in 1805 by an Italian merchant."
    ]
  }
];

// Helper to shuffle choices
function shuffleChoices(q) {
  let choices = [...q.choices];
  for (let i = choices.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

// Initialize game variables
function initGame() {
  player = { x: 50, y: 300, width: 50, height: 50, vy: 0 };
  obstacles = [];
  obstacleSpeed = 3;
  points = 0;
  questionIndex = 0;
  gamePaused = false;
  gameStarted = true;
}

// Quiz logic
function showQuestion() {
  gamePaused = true;
  quizOverlay.style.display = 'flex';
  let q = questions[questionIndex];
  questionText.innerText = q.question;
  let shuffled = shuffleChoices(q);
  choicesContainer.innerHTML = '';
  shuffled.forEach(choice => {
    const div = document.createElement('div');
    div.className = 'choice';
    div.innerText = choice;
    div.onclick = () => checkAnswer(choice, q.answer);
    choicesContainer.appendChild(div);
  });
}

function checkAnswer(selected, correct) {
  quizOverlay.style.display = 'none';
  if (selected === correct) {
    gamePaused = false;
    points += 1000;
    questionIndex = (questionIndex + 1) % questions.length;
  } else {
    points -= 500;
    wrongText.innerText = `You got it wrong! The correct answer is: ${correct}\n-500 points`;
    wrongOverlay.style.display = 'flex';
  }
}

continueBtn.onclick = () => {
  wrongOverlay.style.display = 'none';
  gamePaused = false;
  questionIndex = (questionIndex + 1) % questions.length;
}

// Obstacle generation with improved ramps
function addObstacle() {
  let type = Math.random() < 0.5 ? 'spike' : 'ramp';
  if (type === 'spike') {
    let height = Math.random() * 50 + 20;
    obstacles.push({ x: canvas.width, y: canvas.height - height, width: 20, height, type: 'spike' });
  } else {
    let width = Math.random() * 60 + 40;  // variable ramp width
    let height = Math.random() * 50 + 20; // variable ramp height
    let color = height > 50 ? 'darkgreen' : 'green'; // steeper ramps darker
    obstacles.push({ x: canvas.width, y: canvas.height - height, width, height, type: 'ramp', color });
  }
}

// Update loop
function update() {
  if (!gamePaused && gameStarted) {
    player.vy += 0.5;
    player.y += player.vy;
    if (player.y + player.height > canvas.height) { player.y = canvas.height - player.height; player.vy = 0; }

    obstacles.forEach(o => o.x -= obstacleSpeed);
    obstacles = obstacles.filter(o => o.x + o.width > 0);

    if (Math.random() < 0.02 + points / 50000) addObstacle();

    // Collision detection
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        if (player.x < o.x + o.width && player.x + player.width > o.x &&
            player.y < o.y + o.height && player.y + player.height > o.y) {
          showQuestion();
        }
      } else if (o.type === 'ramp') {
        let rampTopY = o.y;
        let rampLeftX = o.x;
        let rampRightX = o.x + o.width;

        if (player.x + player.width > rampLeftX && player.x < rampRightX) {
          if (player.y + player.height > rampTopY) {
            // Land on top
            player.y = rampTopY - player.height;
            player.vy = 0;
          }
        }
      }
    });

    if (points < -2000) triggerGameOver(); // optional game-over condition
  }
}

// Draw loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameStarted) return;

  ctx.fillStyle = 'red';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  obstacles.forEach(o => {
    if (o.type === 'spike') {
      ctx.fillStyle = 'black';
      ctx.fillRect(o.x, o.y, o.width, o.height);
    } else if (o.type === 'ramp') {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.height);
      ctx.lineTo(o.x + o.width, o.y + o.height);
      ctx.lineTo(o.x + o.width, o.y);
      ctx.closePath();
      ctx.fill();
    }
  });

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Points: ' + points, 10, 30);
}

// Game over
function triggerGameOver() {
  gameStarted = false;
  gameOverScreen.style.display = 'flex';
  finalPoints.innerText = `Your Points: ${points}`;
}

// Main loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Controls
window.addEventListener('keydown', e => {
  if (e.code === 'Space' && player.y + player.height >= canvas.height) {
    player.vy = -10;
  }
});

// Start & restart buttons
startBtn.onclick = () => {
  startScreen.style.display = 'none';
  initGame();
};

restartBtn.onclick = () => {
  gameOverScreen.style.display = 'none';
  initGame();
};

loop();
