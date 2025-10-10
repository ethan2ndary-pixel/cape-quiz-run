window.onload = () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

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

  let player, spikes, orbs, gravity, jumpPower, gameSpeed, score, quizActive, running;
  let questionIndex = 0;
  let highs = JSON.parse(localStorage.getItem("capeHighScores")) || [];

  const questions = [
    {q:"Which city is closest to Table Mountain?",o:["Cape Town","Johannesburg","Durban","Pretoria"],a:0},
    {q:"What type of rock mainly forms Table Mountain?",o:["Granite","Sandstone","Limestone","Basalt"],a:1},
    {q:"The Cape Floristic Region is famous for its:",o:["Rainforests","Fynbos","Savannas","Deserts"],a:1},
    {q:"Which ocean borders the Cape Peninsula?",o:["Atlantic","Indian","Arctic","Pacific"],a:0},
    {q:"What mountain range extends from the Cape to the Eastern Cape?",o:["Drakensberg","Cederberg","Hottentots-Holland","Outeniqua"],a:3},
    {q:"What is the flat top of Table Mountain called?",o:["Plateau","Mesa","Summit","Peak"],a:1}
  ];

  function createPlayer() {
    return { x:150, y:canvas.height-100, w:50, h:80, vy:0, jumping:false };
  }

  function reset() {
    player=createPlayer(); spikes=[]; orbs=[];
    gravity=0.3; jumpPower=-9; gameSpeed=6;
    score=0; quizActive=false; running=true;
    questionIndex = 0;
    gameLoop();
  }

  function jump() {
    if(!player.jumping) { player.vy=jumpPower; player.jumping=true; }
  }

  window.addEventListener("keydown", e=>{
    if(e.code==="Space"&&!quizActive&&running) jump();
  });
  window.addEventListener("touchstart", ()=>{
    if(!quizActive&&running) jump();
  });

  function spike() {
    spikes.push({x:canvas.width,y:canvas.height-60,w:40,h:60});
  }

  function orb() {
    orbs.push({x:canvas.width,y:canvas.height-120,r:20});
  }

  function drawCartoonMountains() {
    const groundHeight = canvas.height - 80;
    ctx.fillStyle = "#87CEEB"; // sky
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#9cd3b0";
    ctx.beginPath();
    ctx.moveTo(0, groundHeight);
    for(let x=0;x<=canvas.width;x+=150){
      const y = groundHeight - 100 - Math.random()*80;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, groundHeight);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, groundHeight, canvas.width, 100);
  }

  function gameLoop() {
    if(!running) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawCartoonMountains();

    player.y += player.vy;
    player.vy += gravity;
    if(player.y > canvas.height - 100) {
      player.y = canvas.height - 100;
      player.vy = 0;
      player.jumping = false;
    }

    ctx.fillStyle = "#222";
    ctx.fillRect(player.x, player.y - player.h, player.w, player.h);

    if(Math.random() < 0.01) spike();
    spikes.forEach((s,i)=>{
      s.x -= gameSpeed;
      ctx.beginPath();
      ctx.moveTo(s.x,s.y);
      ctx.lineTo(s.x+s.w/2,s.y-s.h);
      ctx.lineTo(s.x+s.w,s.y);
      ctx.closePath();
      ctx.fillStyle="#654321";
      ctx.fill();
      if(s.x+s.w<0)spikes.splice(i,1);
      if(player.x<s.x+s.w && player.x+player.w>s.x && player.y>s.y-s.h) end();
    });

    if(Math.random() < 0.005) orb();
    orbs.forEach((o,i)=>{
      o.x -= gameSpeed;
      ctx.beginPath();
      ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
      ctx.fillStyle="gold";
      ctx.fill();
      if(o.x+o.r<0)orbs.splice(i,1);
      if(player.x<o.x+o.r && player.x+player.w>o.x-o.r &&
         player.y-player.h<o.y+o.r && player.y>o.y-o.r) {
        orbs.splice(i,1);
        quiz();
      }
    });

    score++;
    if(score%500===0) gameSpeed += 0.4;

    ctx.fillStyle="black";
    ctx.font="24px Trebuchet MS";
    ctx.fillText("Score: " + score, 20, 40);

    if(!quizActive) requestAnimationFrame(gameLoop);
  }

  function quiz() {
    quizActive = true;
    if(questionIndex >= questions.length) questionIndex = 0;
    const q = questions[questionIndex++];
    quizQuestion.textContent = q.q;
    quizOptions.innerHTML = "";
    q.o.forEach((opt,i)=>{
      const b=document.createElement("button");
      b.textContent = opt;
      b.onclick = ()=>{
        if(i===q.a) score += 100;
        quizPopup.classList.add("hidden");
        quizActive=false;
        gameLoop();
      };
      quizOptions.appendChild(b);
    });
    quizPopup.classList.remove("hidden");
  }

  function end() {
    running = false;
    canvas.classList.add("hidden");
    gameOverScreen.classList.remove("hidden");
    finalScore.textContent = `Your Score: ${score}`;
  }

  saveScoreButton.onclick = () => {
    const name = playerNameInput.value.trim() || "Player";
    highs.push({name,score});
    highs.sort((a,b)=>b.score-a.score);
    highs = highs.slice(0,5);
    localStorage.setItem("capeHighScores", JSON.stringify(highs));
    location.reload();
  };

  startButton.onclick = () => {
    startScreen.classList.add("fade");
    startScreen.classList.add("hide");
    setTimeout(()=>{
      startScreen.classList.add("hidden");
      canvas.classList.remove("hidden");
      reset();
    }, 800);
  };

  restartButton.onclick = () => {
    gameOverScreen.classList.add("hidden");
    canvas.classList.remove("hidden");
    reset();
  };

  function showScores() {
    scoreList.innerHTML = "";
    highs.forEach(s=>{
      const li=document.createElement("li");
      li.textContent = `${s.name}: ${s.score}`;
      scoreList.appendChild(li);
    });
  }
  showScores();
};
