const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// UI elements
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

// Game vars
let player, spikes, orbs, gravity, jumpPower, gameSpeed, score, quizActive, running;
let highs = JSON.parse(localStorage.getItem("capeHighScores")) || [];

const bg = new Image();
bg.src = "https://upload.wikimedia.org/wikipedia/commons/2/25/Table_Mountain_from_Bloubergstrand.jpg";

function createPlayer() {
  return { x:150, y:canvas.height-100, w:50, h:80, vy:0, jumping:false };
}

function reset() {
  player=createPlayer(); spikes=[]; orbs=[];
  gravity=0.4; jumpPower=-10; gameSpeed=6;
  score=0; quizActive=false; running=true;
  gameLoop();
}

function jump(){
  if(!player.jumping){ player.vy=jumpPower; player.jumping=true; }
}

window.addEventListener("keydown", e=>{
  if(e.code==="Space"&&!quizActive&&running) jump();
});
window.addEventListener("touchstart", ()=>{
  if(!quizActive&&running) jump();
});

function spike(){spikes.push({x:canvas.width,y:canvas.height-60,w:40,h:60});}
function orb(){orbs.push({x:canvas.width,y:canvas.height-120,r:20});}

const questions=[
  {q:"Which city is closest to Table Mountain?",o:["Cape Town","Johannesburg","Durban","Pretoria"],a:0},
  {q:"What rock mainly makes up Table Mountain?",o:["Granite","Sandstone","Limestone","Basalt"],a:1},
  {q:"The Cape Floristic Region is famous for its:",o:["Deserts","Rainforests","Fynbos","Savannas"],a:2},
];

function loop(){
  if(!running)return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bg,-score*0.5,0,canvas.width*2,canvas.height);
  // gravity
  player.y+=player.vy; player.vy+=gravity;
  if(player.y>canvas.height-100){player.y=canvas.height-100;player.vy=0;player.jumping=false;}
  // draw player
  ctx.fillStyle="#222"; ctx.fillRect(player.x,player.y-player.h,player.w,player.h);
  // spikes
  if(Math.random()<0.01) spike();
  spikes.forEach((s,i)=>{
    s.x-=gameSpeed;
    ctx.beginPath();
    ctx.moveTo(s.x,s.y);
    ctx.lineTo(s.x+s.w/2,s.y-s.h);
    ctx.lineTo(s.x+s.w,s.y);
    ctx.closePath(); ctx.fillStyle="#654321"; ctx.fill();
    if(s.x+s.w<0)spikes.splice(i,1);
    if(player.x<s.x+s.w&&player.x+player.w>s.x&&player.y>s.y-s.h) end();
  });
  // orbs
  if(Math.random()<0.005) orb();
  orbs.forEach((o,i)=>{
    o.x-=gameSpeed;
    ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fillStyle="gold";ctx.fill();
    if(o.x+o.r<0)orbs.splice(i,1);
    if(player.x<o.x+o.r&&player.x+player.w>o.x-o.r&&player.y-player.h<o.y+o.r&&player.y>o.y-o.r){
      orbs.splice(i,1); quiz();
    }
  });
  score++; if(score%500===0)gameSpeed+=0.5;
  ctx.fillStyle="black"; ctx.font="24px Trebuchet MS"; ctx.fillText("Score: "+score,20,40);
  if(!quizActive)requestAnimationFrame(loop);
}

function quiz(){
  quizActive=true;
  const q=questions[Math.floor(Math.random()*questions.length)];
  quizQuestion.textContent=q.q; quizOptions.innerHTML="";
  q.o.forEach((opt,i)=>{
    const b=document.createElement("button");
    b.textContent=opt;
    b.onclick=()=>{
      if(i===q.a)score+=100;
      quizPopup.classList.add("hidden");quizActive=false;loop();
    };
    quizOptions.appendChild(b);
  });
  quizPopup.classList.remove("hidden");
}

function end(){
  running=false;
  canvas.classList.add("hidden");
  gameOverScreen.classList.remove("hidden");
  gameOverScreen.classList.add("show");
  finalScore.textContent=`Your Score: ${score}`;
}

saveScoreButton.onclick=()=>{
  const name=playerNameInput.value.trim()||"Player";
  highs.push({name,score});
  highs.sort((a,b)=>b.score-a.score);
  highs=highs.slice(0,5);
  localStorage.setItem("capeHighScores",JSON.stringify(highs));
  location.reload();
};

startButton.onclick=()=>{
  startScreen.classList.add("hidden");
  canvas.classList.remove("hidden");
  reset();
};

restartButton.onclick=()=>{
  gameOverScreen.classList.add("hidden");
  canvas.classList.remove("hidden");
  reset();
};

function showScores(){
  scoreList.innerHTML="";
  highs.forEach(s=>{
    const li=document.createElement("li");
    li.textContent=`${s.name}: ${s.score}`;
    scoreList.appendChild(li);
  });
}
showScores();
