/* Cape Mountains Quiz Runner - final upgraded version
   - Photo-style parallax backgrounds (replace URLs below if you want)
   - Spikes (triangles) as obstacles
   - Cartoon-style human male runner (canvas-drawn)
   - Quiz orbs pause the game; multiple-choice questions (editable array)
   - Local high score saved to localStorage
*/

/* ---------- BACKGROUNDS: replace with direct image URLs if you want ---------- */
const backgroundImages = [
  "https://upload.wikimedia.org/wikipedia/commons/2/25/Table_mountain_and_the_ocean_cape_town.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/8/8e/Table_Mountain_-_South_Africa_%2824185367888%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/a/a3/Cape_Town_-_2018-07-16_-_Table_Mountain_-_7645.jpg"
];

/* ---------- QUESTIONS: multiple choice, 8th-grade level, editable ---------- */
/* Format:
   { q: "Question text",
     choices: ["A","B","C","D"],
     answer: index_of_correct (0..3),
     points: number (bonus for correct)
   }
*/
let questions = [
  { q: "Which flat-topped mountain overlooks the city of Cape Town?", choices: ["Lion's Head","Table Mountain","Devil's Peak","Signal Hill"], answer: 1, points: 100 },
  { q: "Which ocean lies to the west of Cape Town?", choices: ["Atlantic Ocean","Indian Ocean","Pacific Ocean","Southern Ocean"], answer: 0, points: 100 },
  { q: "What vegetation type is most associated with the Cape region?", choices: ["Fynbos","Rainforest","Savanna","Tundra"], answer: 0, points: 100 },
  { q: "The Cape Fold Belt was formed mainly by which process?", choices: ["Volcanic eruption","Tectonic uplift and folding","Glaciation","Coral growth"], answer: 1, points: 120 },
  { q: "Which important resource do mountains often provide to coastal areas?", choices: ["Fresh water from streams and springs","Tropical fruits","Petroleum oil","Salt deposits"], answer: 0, points: 90 },
  { q: "Which of these animals is commonly associated with rocky Cape mountain habitats?", choices: ["Klipspringer (small antelope)","Polar bear","Kakapo","Camel"], answer: 0, points: 90 },
  { q: "What is a major reason to conserve mountain areas near capes?", choices: ["They protect biodiversity and water supply","They always contain gold","They stop earthquakes","They make the land flat"], answer: 0, points: 100 },
  { q: "Which wind phenomenon often affects the Cape region, making conditions dry and warm?", choices: ["Föhn / Bergwind","Monsoon","Sirocco","Chinook"], answer: 0, points: 100 }
];

/* ---------- CORE SETUP ---------- */
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

let W = innerWidth, H = innerHeight;
canvas.width = W; canvas.height = H;
window.addEventListener("resize", ()=>{ W = innerWidth; H = innerHeight; canvas.width = W; canvas.height = H; });

/* game state */
let running=false, lastTime=0;
let player, obstacles, orbs;
let distance=0, score=0, highScore = parseInt(localStorage.getItem("capeHighScore"))||0;
let bgLayers = []; // {img, x, speed}
let spawnTimer=0, orbTimer=0, nextQuestionAt=400 + Math.random()*200;

/* preload backgrounds */
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

/* reset */
function resetGame(){
  player = {x:140, y:H*0.75 - 80, w:44, h:72, vy:0, jumping:false};
  obstacles = []; orbs = [];
  distance = 0; score = 0;
  running = true; lastTime = performance.now();
  spawnTimer = 0; orbTimer = 0; nextQuestionAt = 400 + Math.random()*200;
}

/* input */
function jump(){ if(!player.jumping){ player.vy = -18; player.jumping = true; } }
window.addEventListener("keydown", e=>{ if(e.code==="Space"){ e.preventDefault(); if(!running) start(); else jump(); } });
canvas.addEventListener("pointerdown", ()=>{ if(!running) start(); else jump(); });

startBtn.onclick = ()=>{ start(); }
restartBtn.onclick = ()=>{ gameOverScreen.classList.add("hidden"); start(); }
menuBtn.onclick = ()=>{ gameOverScreen.classList.add("hidden"); startScreen.classList.remove("hidden"); running=false; }
editQuestionsBtn.onclick = ()=>{ // quick edit via prompt for convenience
  const payload = prompt("Edit questions JSON (array of {q,choices,answer,points}):\n\nCurrent JSON will appear; edit carefully.", JSON.stringify(questions, null, 2));
  if(payload){ try{ const parsed = JSON.parse(payload); if(Array.isArray(parsed)){ questions = parsed; alert("Questions updated!"); } else alert("Please provide an array."); } catch(err){ alert("Invalid JSON: " + err.message); } }
}

/* spawn obstacles (spikes) and orbs */
function spawnSpike(){
  const w = 40 + Math.random()*40;
  const h = 36 + Math.random()*50;
  obstacles.push({x: W + 60, y: H*0.75 - h, w: w, h: h});
}
function spawnOrb(isQuestion=false){
  orbs.push({x: W + 60, y: H*0.75 - 130 - Math.random()*160, r:16, question:isQuestion});
}

/* collisions */
function rectIntersect(a,b){ return !(b.x>a.x+a.w || b.x+b.w<a.x || b.y>a.y+a.h || b.y+b.h<a.y); }
function circleRect(cx,cy,r,rx,ry,rw,rh){ const nx = Math.max(rx, Math.min(cx, rx+rw)); const ny = Math.max(ry, Math.min(cy, ry+rh)); const dx = cx - nx, dy = cy - ny; return dx*dx + dy*dy <= r*r; }

/* question UI */
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

/* toast */
let toastTimer = null;
function showToast(text, ms=1200){
  toast.textContent = text; toast.classList.remove("hidden");
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ toast.classList.add("hidden"); toastTimer=null; }, ms);
}

/* draw helpers */
function drawBackground(dt){
  // draw background layers with horizontal tiling
  bgLayers.forEach((b, idx)=>{
    const speed = b.speed * (0.4 + idx*0.6);
    b.x -= speed * (dt/16) * (1 + score/4000);
    const img = b.img;
    if(!img || !img.complete){ ctx.fillStyle = idx===0 ? "#dfeffd" : "#cbe6ff"; ctx.fillRect(0, idx*30, W, H*(0.7 - idx*0.05)); return; }
    // scale image to fill height proportionally
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
    // draw triangular spike(s) — three small triangles for rocky look
    const cols = 3;
    const partW = s.w/cols;
    for(let i=0;i<cols;i++){
      const px = s.x + i*partW;
      const ph = s.h * (0.6 + Math.random()*0.4);
      ctx.beginPath();
      ctx.moveTo(px, s.y + s.h);
      ctx.lineTo(px + partW/2, s.y + s.h - ph);
      ctx.lineTo(px + partW, s.y + s.h);
      ctx.closePath();
      ctx.fill();
      // darker inner triangle
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
  // simple cartoon male runner (head, torso, arms, legs)
  ctx.save();
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.ellipse(x + w/2, y + h + 8, w*0.55, 10, 0, 0, Math.PI*2); ctx.fill();
  // body
  ctx.fillStyle = "#e6b089"; // skin tone
  // head
  ctx.beginPath(); ctx.arc(x + w*0.5, y + 12, w*0.22, 0, Math.PI*2); ctx.fill();
  // torso
  ctx.fillStyle = "#2b6cb0";
  roundRect(ctx, x + w*0.1, y + h*0.2, w*0.8, h*0.45, 8); ctx.fill();
  // legs
  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(x + w*0.15, y + h*0.65, w*0.22, h*0.28);
  ctx.fillRect(x + w*0.63, y + h*0.55, w*0.22, h*0.28);
  // arms (simple)
  ctx.strokeStyle = "#e6b089"; ctx.lineWidth = 8; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x + w*0.88, y + h*0.32); ctx.lineTo(x + w*0.6, y + h*0.45); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w*0.12, y + h*0.32); ctx.lineTo(x + w*0.4, y + h*0.45); ctx.stroke();
  ctx.restore();
}

/* drawing scene */
function draw(dt){
  ctx.clearRect(0,0,W,H);
  // sky fallback
  ctx.fillStyle = "#cfeeff"; ctx.fillRect(0,0,W,H);
  drawBackground(dt);
  // ground
  ctx.fillStyle = "#32492f"; ctx.fillRect(0, H*0.75, W, H*0.25);
  // obstacles (spikes)
  drawSpikes();
  // orbs
  drawOrbs();
  // player
  drawHuman(player.x, player.y, player.w, player.h);
  // HUD
  scoreEl.textContent = "Score: " + Math.floor(score);
  highScoreEl.textContent = "High: " + highScore;
}

/* main loop */
let lastSpawn = 0;
function loop(t){
  if(!running) return;
  const dt = Math.max(16, t - lastTime); lastTime = t;

  // update distance & passive score
  distance += (dt/1000) * 220 * (1 + score/4000);
  score += 0.01 * (dt);

  // physics
  player.vy += 1.8 * (dt/16);
  player.y += player.vy;
  if(player.y > H*0.75 - player.h){ player.y = H*0.75 - player.h; player.vy = 0; player.jumping=false; }

  // spawn timers
  lastSpawn += dt;
  if(lastSpawn > 900 - Math.min(500, distance*0.01)){ spawnSpike(); lastSpawn = 0; }
  orbTimer += dt;
  if(orbTimer > 1600){
    const isQuestion = distance > nextQuestionAt && Math.random() < 0.45;
    spawnOrb(isQuestion);
    if(isQuestion) nextQuestionAt = distance + 800 + Math.random()*600;
    orbTimer = 0;
  }

  // move spikes and collisions
  for(let i=obstacles.length-1;i>=0;i--){
    const s = obstacles[i];
    if(s.x + s.w < -60) { obstacles.splice(i,1); continue; }
    // approximate spike collision: check player feet vs spike top area
    const spikeTopY = s.y;
    // collide if player's bottom intersects triangle area horizontally
    if(player.x + player.w > s.x + 6 && player.x < s.x + s.w - 6 && player.y + player.h > spikeTopY + s.h*0.15){
      // hit spike
      running = false; gameOver(); return;
    }
  }

  // orb collisions
  for(let i=orbs.length-1;i>=0;i--){
    const o = orbs[i];
    if(o.x + o.r < -60){ orbs.splice(i,1); continue; }
    if(circleRect(o.x, o.y, o.r, player.x, player.y, player.w, player.h)){
      if(o.question){
        // choose random question and pause
        running = false;
        const qIdx = Math.floor(Math.random()*questions.length);
        const q = questions[qIdx];
        showQuestion(q, (correct)=>{ running = true; lastTime = performance.now(); });
      } else {
        score += 60;
        showToast("+60");
      }
      orbs.splice(i,1);
    }
  }

  draw(dt);
  if(running) requestAnimationFrame(loop);
}

/* roundRect helper */
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

/* game over */
function gameOver(){
  if(score > highScore){
    highScore = Math.floor(score);
    localStorage.setItem("capeHighScore", highScore);
  }
  document.getElementById("finalScore").textContent = "Score: " + Math.floor(score);
  gameOverScreen.classList.remove("hidden");
  canvas.style.display = "none";
}

/* start */
function start(){
  startScreen.classList.add("hidden");
  canvas.style.display = "block";
  preloadBackgrounds(backgroundImages, ()=>{ resetGame(); lastTime = performance.now(); requestAnimationFrame(loop); });
}

/* initial UI */
scoreEl.textContent = "Score: 0";
highScoreEl.textContent = "High: " + highScore;
canvas.style.display = "none";

/* preload once */
preloadBackgrounds(backgroundImages);
