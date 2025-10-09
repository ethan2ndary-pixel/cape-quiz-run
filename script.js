/* Cape Mountains Quiz Runner — final version with first-name scoreboard saved permanently
   - Full-screen canvas
   - Photo parallax background (replace URLs below)
   - Spikes obstacles (triangles)
   - Quiz orbs (multiple choice, pause game)
   - Top-5 scoreboard with first name + score saved in localStorage
*/

/* ------------------ BACKGROUNDS (replace if you wish) ------------------ */
const backgroundImages = [
  "https://upload.wikimedia.org/wikipedia/commons/2/25/Table_mountain_and_the_ocean_cape_town.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/8/8e/Table_Mountain_-_South_Africa_%2824185367888%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/a/a3/Cape_Town_-_2018-07-16_-_Table_Mountain_-_7645.jpg"
];

/* ------------------ QUESTIONS (8th-grade, multiple choice) ------------------ */
let questions = [
  { q: "Which flat-topped mountain overlooks the city of Cape Town?", choices: ["Lion's Head","Table Mountain","Devil's Peak","Signal Hill"], answer: 1, points: 100 },
  { q: "Which ocean lies to the west of Cape Town?", choices: ["Atlantic Ocean","Indian Ocean","Pacific Ocean","Southern Ocean"], answer: 0, points: 100 },
  { q: "What type of vegetation is Fynbos?", choices: ["Shrubland","Tropical forest","Grassland","Wetland"], answer: 0, points: 100 },
  { q: "The Cape Fold Belt formed mainly by which process?", choices: ["Volcanic eruptions","Tectonic folding and uplift","Glacial carving","Sea-level rise"], answer: 1, points: 120 },
  { q: "Why are Cape mountains important for water supply?", choices: ["They capture rain and fog feeding streams","They produce underground oil","They trap salt for desalination","They block storms completely"], answer: 0, points: 90 },
  { q: "Which animal is adapted to rocky mountain areas in the Cape?", choices: ["Klipspringer","Penguin","Elephant","Giraffe"], answer: 0, points: 90 },
  { q: "Which wind can make the Cape region dry and warm?", choices: ["Bergwind (Föhn)","Mistral","Monsoon","Sirocco"], answer: 0, points: 100 }
];

/* ------------------ CORE / UI ELEMENT SELECTORS ------------------ */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const menuBtn = document.getElementById("menuBtn");
const editQuestionsBtn = document.getElementById("editQuestionsBtn");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOver");
const questionBox = document.getElementById("questionBox");
const questionText = document.getElementById("questionText");
const answersEl = document.getElementById("answers");
const toast = document.getElementById("toast");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const scoreboardEl = document.getElementById("scoreboard");
const playerNameInput = document.getElementById("playerName");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const finalScoreEl = document.getElementById("finalScore");

let W = innerWidth, H = innerHeight;
canvas.width = W; canvas.height = H;
window.addEventListener("resize", ()=>{ W = innerWidth; H = innerHeight; canvas.width = W; canvas.height = H; });

/* ------------------ STATE & PERSISTENCE ------------------ */
let running=false, lastTime=0;
let player, obstacles, orbs;
let distance=0, score=0;
let highScoreList = JSON.parse(localStorage.getItem("capeHighScores")||"[]"); // [{name,score}]
let bgLayers = [];
let spawnTimer=0, orbTimer=0, nextQuestionAt=400 + Math.random()*200;

/* ------------------ Scoreboard functions (persistent) ------------------ */
function saveTopScore(name, sc){
  const entry = { name: (name || "Player").slice(0,24), score: Math.floor(sc) };
  highScoreList.push(entry);
  highScoreList.sort((a,b)=>b.score - a.score);
  if(highScoreList.length > 5) highScoreList = highScoreList.slice(0,5);
  localStorage.setItem("capeHighScores", JSON.stringify(highScoreList));
  renderScoreboard();
}
function renderScoreboard(){
  scoreboardEl.innerHTML = "";
  if(highScoreList.length === 0){
    scoreboardEl.innerHTML = "<div style='padding:8px;color:#f0f0f0;opacity:.9'>No scores yet — be the first!</div>";
    return;
  }
  highScoreList.forEach((r, i)=>{
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<div>${i+1}. ${escapeHtml(r.name)}</div><div>${r.score}</div>`;
    scoreboardEl.appendChild(row);
  });
}
// simple escape
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

renderScoreboard();

/* ------------------ Background preloader ------------------ */
function preloadBackgrounds(list, cb){
  bgLayers = list.map((url,i)=>({img:new Image(), x:0, speed: 0.2 + i*0.25, url}));
  let loaded=0;
  bgLayers.forEach(b=>{
    b.img.crossOrigin = "anonymous";
    b.img.onload = ()=>{ loaded++; if(loaded===bgLayers.length) cb && cb(); };
    b.img.onerror = ()=>{ console.warn("bg load error:", b.url); loaded++; if(loaded===bgLayers.length) cb && cb(); };
    b.img.src = b.url;
  });
}

/* ------------------ Game reset/start ------------------ */
function resetGame(){
  player = {x:140, y:H*0.75 - 80, w:44, h:72, vy:0, jumping:false};
  obstacles = []; orbs = [];
  distance = 0; score = 0;
  running = true; lastTime = performance.now();
  spawnTimer = 0; orbTimer = 0; nextQuestionAt = 400 + Math.random()*200;
  playerNameInput.value = "";
  saveScoreBtn.disabled = true;
  canvas.style.display = "block";
  questionBox.classList.add("hidden");
}
function start(){
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  preloadBackgrounds(backgroundImages, ()=>{ resetGame(); requestAnimationFrame(loop); });
}

/* ------------------ Input ------------------ */
function jump(){ if(!player.jumping){ player.vy = -18; player.jumping = true; } }
window.addEventListener("keydown", e=>{ if(e.code==="Space"){ e.preventDefault(); if(!running) start(); else jump(); } });
canvas.addEventListener("pointerdown", ()=>{ if(!running) start(); else jump(); });

startBtn.onclick = ()=> start();
restartBtn.onclick = ()=> { gameOverScreen.classList.add("hidden"); start(); };
menuBtn.onclick = ()=> { gameOverScreen.classList.add("hidden"); startScreen.classList.remove("hidden"); running=false; };
editQuestionsBtn.onclick = ()=> {
  const payload = prompt("Edit questions JSON (array of {q,choices,answer,points}):\n\nCurrent JSON will appear; edit carefully.", JSON.stringify(questions, null, 2));
  if(payload){ try{ const parsed = JSON.parse(payload); if(Array.isArray(parsed)){ questions = parsed; alert("Questions updated!"); } else alert("Please provide an array."); } catch(err){ alert("Invalid JSON: " + err.message); } }
};

/* enable Save button only when a name is present */
playerNameInput.addEventListener("input", ()=>{
  saveScoreBtn.disabled = playerNameInput.value.trim().length === 0;
});
saveScoreBtn.addEventListener("click", ()=>{
  const name = playerNameInput.value.trim() || "Player";
  saveTopScore(name, score);
  // After saving, return to start screen
  gameOverScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
});

/* ------------------ Spawns & collisions ------------------ */
function spawnSpike(){
  const w = 40 + Math.random()*40;
  const h = 36 + Math.random()*50;
  obstacles.push({x: W + 60, y: H*0.75 - h, w: w, h: h});
}
function spawnOrb(isQuestion=false){
  orbs.push({x: W + 60, y: H*0.75 - 130 - Math.random()*160, r:16, question:isQuestion});
}
function rectIntersect(a,b){ return !(b.x>a.x+a.w || b.x+b.w<a.x || b.y>a.y+a.h || b.y+b.h<a.y); }
function circleRect(cx,cy,r,rx,ry,rw,rh){ const nx = Math.max(rx, Math.min(cx, rx+rw)); const ny = Math.max(ry, Math.min(cy, ry+rh)); const dx = cx - nx, dy = cy - ny; return dx*dx + dy*dy <= r*r; }

/* ------------------ Question flow ------------------ */
function showQuestion(qobj, onAnswer){
  questionText.textContent = qobj.q;
  answersEl.innerHTML = "";
  qobj.choices.forEach((c, idx)=>{
    const b = document.createElement("button");
    b.className = "answerBtn";
    b.textContent = c;
    b.onclick = ()=>{
      const correct = idx === qobj.answer;
      if(correct){ b.classList.add("correct"); showToast("Correct! +" + (qobj.points||100) + " pts"); score += (qobj.points||100); }
      else { b.classList.add("wrong"); showToast("Wrong"); score = Math.max(0, score - (qobj.points? Math.floor(qobj.points/4):10)); }
      Array.from(answersEl.children).forEach(btn=>btn.disabled=true);
      setTimeout(()=>{ questionBox.classList.add("hidden"); onAnswer(correct); }, 800);
    };
    answersEl.appendChild(b);
  });
  questionBox.classList.remove("hidden");
}

/* ------------------ Visuals & Draw helpers ------------------ */
function drawBackground(dt){
  bgLayers.forEach((b, idx)=>{
    const speed = b.speed * (0.4 + idx*0.6);
    b.x -= speed * (dt/16) * (1 + score/4000);
    const img = b.img;
    if(!img || !img.complete){
      ctx.fillStyle = idx===0 ? "#dfeffd" : "#cbe6ff"; ctx.fillRect(0, idx*30, W, H*(0.7 - idx*0.05)); return;
    }
    const scale = Math.max(W / img.width, (H*0.7) / img.height);
    const drawW = img.width * scale, drawH = img.height * scale;
    let x = b.x % drawW;
    for(let i=-1;i<Math.ceil(W/drawW)+2;i++){
      ctx.drawImage(img, x + i*drawW, 0, drawW, drawH);
    }
  });
}

function drawSpikes(){
  ctx.fillStyle = "#5a3d32";
  obstacles.forEach(s=>{
    const cols = 3;
    const partW = s.w/cols;
    for(let i=0;i<cols;i++){
      const px = s.x + i*partW;
      const ph = s.h * (0.6 + (i*0.05));
      ctx.beginPath();
      ctx.moveTo(px, s.y + s.h);
      ctx.lineTo(px + partW/2, s.y + s.h - ph);
      ctx.lineTo(px + partW, s.y + s.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.beginPath();
      ctx.moveTo(px + partW*0.25, s.y + s.h);
      ctx.lineTo(px + partW/2, s.y + s.h - ph*0.6);
      ctx.lineTo(px + partW*0.75, s.y + s.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#5a3d32";
    }
    s.x -= 6 * (1 + score/8000);
  });
}

function drawOrbs(){
  orbs.forEach(o=>{
    const t = performance.now()/300;
    ctx.beginPath();
    ctx.shadowColor = "rgba(255,240,160,0.6)"; ctx.shadowBlur = 14;
    ctx.fillStyle = "rgba(255,255,160,0.95)";
    ctx.arc(o.x, o.y + Math.sin(t)*4, o.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    o.x -= 6 * (1 + score/8000);
  });
}

function drawHuman(x,y,w,h){
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.ellipse(x + w/2, y + h + 8, w*0.6, 10, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#e6b089";
  ctx.beginPath(); ctx.arc(x + w*0.5, y + 12, w*0.22, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#2b6cb0";
  roundRect(ctx, x + w*0.1, y + h*0.18, w*0.8, h*0.44, 8); ctx.fill();
  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(x + w*0.12, y + h*0.64, w*0.22, h*0.28);
  ctx.fillRect(x + w*0.62, y + h*0.54, w*0.22, h*0.28);
  ctx.strokeStyle = "#e6b089"; ctx.lineWidth = 8; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x + w*0.88, y + h*0.32); ctx.lineTo(x + w*0.6, y + h*0.45); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w*0.12, y + h*0.32); ctx.lineTo(x + w*0.4, y + h*0.45); ctx.stroke();
  ctx.restore();
}

function draw(dt){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "#cfeeff"; ctx.fillRect(0,0,W,H);
  drawBackground(dt);
  ctx.fillStyle = "#32492f"; ctx.fillRect(0, H*0.75, W, H*0.25);
  drawSpikes();
  drawOrbs();
  drawHuman(player.x, player.y, player.w, player.h);
  scoreEl.textContent = "Score: " + Math.floor(score);
  highScoreEl.textContent = "High: " + (highScoreList[0]? highScoreList[0].score:0);
}

/* ------------------ Loop ------------------ */
let lastSpawn = 0;
function loop(t){
  if(!running) return;
  const dt = Math.max(16, t - lastTime); lastTime = t;
  distance += (dt/1000) * 220 * (1 + score/4000);
  score += 0.01 * (dt);
  player.vy += 1.8 * (dt/16);
  player.y += player.vy;
  if(player.y > H*0.75 - player.h){ player.y = H*0.75 - player.h; player.vy = 0; player.jumping=false; }

  lastSpawn += dt;
  if(lastSpawn > 900 - Math.min(500, distance*0.01)){ spawnSpike(); lastSpawn = 0; }
  orbTimer += dt;
  if(orbTimer > 1600){
    const isQuestion = distance > nextQuestionAt && Math.random() < 0.45;
    spawnOrb(isQuestion);
    if(isQuestion) nextQuestionAt = distance + 800 + Math.random()*600;
    orbTimer = 0;
  }

  for(let i=obstacles.length-1;i>=0;i--){
    const s = obstacles[i];
    if(s.x + s.w < -60){ obstacles.splice(i,1); continue; }
    if(player.x + player.w > s.x + 6 && player.x < s.x + s.w - 6 && player.y + player.h > s.y + s.h*0.15){
      running = false; gameOver(); return;
    }
  }

  for(let i=orbs.length-1;i>=0;i--){
    const o = orbs[i];
    if(o.x + o.r < -60){ orbs.splice(i,1); continue; }
    if(circleRect(o.x, o.y, o.r, player.x, player.y, player.w, player.h)){
      if(o.question){
        running = false;
        const qIdx = Math.floor(Math.random()*questions.length);
        const q = questions[qIdx];
        showQuestion(q, (correct)=>{ running = true; lastTime = performance.now(); });
      } else {
        score += 60; showToast("+60");
      }
      orbs.splice(i,1);
    }
  }

  draw(dt);
  if(running) requestAnimationFrame(loop);
}

/* ------------------ Utilities ------------------ */
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

/* ------------------ Game Over ------------------ */
function gameOver(){
  document.getElementById("finalScore").textContent = "Score: " + Math.floor(score);
  gameOverScreen.classList.remove("hidden");
  canvas.style.display = "none";
}

/* ------------------ Init & Preload ------------------ */
function init(){
  renderScoreboard();
  preloadBackgrounds(backgroundImages);
  canvas.style.display = "none";
}
init();
