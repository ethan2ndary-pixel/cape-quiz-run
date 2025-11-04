(function(){
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');

const startScreen=document.getElementById('startScreen');
const startBtn=document.getElementById('startBtn');
const gameOverScreen=document.getElementById('gameOverScreen');
const finalPoints=document.getElementById('finalPoints');
const restartBtn=document.getElementById('restartBtn');
const highScoreStartList=document.getElementById('highScoreStartList');
const highScoreGameOverList=document.getElementById('highScoreGameOverList');

const quizOverlay=document.getElementById('quizOverlay');
const questionText=document.getElementById('questionText');
const choicesContainer=document.getElementById('choicesContainer');

const wrongOverlay=document.getElementById('wrongOverlay');
const wrongText=document.getElementById('wrongText');
const continueBtn=document.getElementById('continueBtn');

// Game Variables
let player, obstacles, obstacleSpeed, points, questionIndex;
let gamePaused=false, gameStarted=false;
let state="cutscene"; // cutscene, start, playing, paused, gameover
let cutsceneTime=0;
const cutsceneDuration=360; // 6s at 60fps

let highScores = JSON.parse(localStorage.getItem('capeEscapeHighScores')) || [];

let character={x:50, y:260, width:30, height:30, speed:3};
let clouds=[{x:50,y:50},{x:300,y:80},{x:600,y:40}];

const questions=[
{question:"What is an NC cape?",answer:"A cape is a piece of land that extends into a body of water",choices:["A cape is a piece of land that extends into a body of water","A type of clothing worn by superheroes","A small mountain or hill","A type of ship used for trade"]},
{question:"What are the characteristics of a cape?",answer:"Smaller in size, rather pointed, steep cliffs",choices:["Smaller in size, rather pointed, steep cliffs","Flat and wide with gentle slopes","Covered mostly in forests","Always found near deserts"]},
{question:"How are capes formed?",answer:"Capes are formed by erosion",choices:["Capes are formed by erosion","Capes are formed by volcanic eruptions","Capes are formed by earthquakes","Capes are formed by human construction"]},
{question:"What is the ecological importance of capes?",answer:"Capes are coastal promontories that serve as ecological hot spots, providing a variety of critical ecosystem services.",choices:["Capes are coastal promontories that serve as ecological hot spots, providing a variety of critical ecosystem services.","Capes have no ecological importance.","Capes are used only for shipping and trade routes.","Capes are man-made structures for flood control."]},
{question:"When were capes discovered?",answer:"The capes were discovered in 1488 by a Portuguese navigator.",choices:["The capes were discovered in 1488 by a Portuguese navigator.","The capes were discovered in 1600 by a Spanish explorer.","The capes were discovered in 1200 by a British sailor.","The capes were discovered in 1805 by an Italian merchant."]}
];

function shuffleChoices(q){let arr=[...q.choices];for(let i=arr.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}

// Initialize Game
function initGame(){
player={x:50,y:300,width:50,height:50,vy:0};
obstacles=[];
obstacleSpeed=3;
points=0;
questionIndex=0;
gamePaused=false;
gameStarted=true;
state="playing";
}

// High Score Functions
function showHighScores(element){
element.innerHTML='';
highScores.forEach((hs,i)=>{
  const div=document.createElement('div');
  div.innerText=`${i+1}. ${hs.name} - ${hs.score}`;
  element.appendChild(div);
});
}

function updateHighScores(score){
let name=prompt("New High Score! Enter your name:","Player");
if(!name) name="Player";
name=name.substring(0,15);
highScores.push({name,score});
highScores.sort((a,b)=>b.score-b.score?0:b.score-b.score); // sort descending
if(highScores.length>5) highScores.pop();
localStorage.setItem('capeEscapeHighScores', JSON.stringify(highScores));
}

// Quiz Functions
function showQuestion(){
gamePaused=true;
state="paused";
quizOverlay.style.display='flex';
const q=questions[questionIndex];
questionText.innerText=q.question;
const shuffled=shuffleChoices(q);
choicesContainer.innerHTML='';
shuffled.forEach(choice=>{
  const div=document.createElement('div');
  div.className='choice';
  div.innerText=choice;
  div.onclick=()=>checkAnswer(choice,q.answer);
  choicesContainer.appendChild(div);
});
}

function checkAnswer(selected,correct){
quizOverlay.style.display='none';
if(selected===correct){gamePaused=false; state="playing"; points+=1000; questionIndex=(questionIndex+1)%questions.length;}
else{points-=500; wrongText.innerText=`You got it wrong! Correct: ${correct}\n-500 points`; wrongOverlay.style.display='flex';}
}

continueBtn.addEventListener('click',()=>{
wrongOverlay.style.display='none'; gamePaused=false; state="playing"; questionIndex=(questionIndex+1)%questions.length;
});

// Obstacles
function addObstacle(){
const type=Math.random()<0.5?'spike':'ramp';
if(type==='spike'){const height=Math.random()*50+20;obstacles.push({x:canvas.width,y:canvas.height-height,width:20,height,type:'spike'});}
else{const width=Math.random()*60+40;const height=Math.random()*50+20;obstacles.push({x:canvas.width,y:canvas.height-height,width,height,type:'ramp'});}
}

// Cutscene Functions
function updateCutscene(){
cutsceneTime++;
character.x += character.speed;
if(character.x>canvas.width) character.x=-character.width;
clouds.forEach(c=>{c.x+=0.7;if(c.x>canvas.width)c.x=-100;});
if(cutsceneTime>cutsceneDuration){state="start"; startScreen.style.display='flex'; showHighScores(highScoreStartList);}
}

function drawCutscene(){
ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.fillStyle='#87ceeb'; ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.fillStyle='white'; clouds.forEach(c=>ctx.fillRect(c.x,c.y,80,30));
ctx.fillStyle='#1E90FF'; for(let i=0;i<5;i++){ctx.fillRect(400+i*30,300+Math.sin((cutsceneTime+i)/10)*5,30,20);}
ctx.fillStyle='#228B22'; ctx.fillRect(0,300,canvas.width,100);
ctx.fillStyle='#8B4513'; ctx.fillRect(450,250,50,50);
let bounce=Math.sin(cutsceneTime/5)*5; ctx.fillStyle='red'; ctx.fillRect(character.x,character.y-bounce,character.width,character.height);
ctx.fillStyle='white'; ctx.font='24px Arial';
if(cutsceneTime<120) ctx.fillText("A cape is land that extends into water!",100,100);
else if(cutsceneTime<240) ctx.fillText("Capes have cliffs and are formed by erosion!",100,100);
else ctx.fillText("Capes are ecological hotspots!",100,100);
}

// Game Functions
function updateGame(){
player.vy+=0.5; player.y+=player.vy;
if(player.y+player.height>canvas.height){player.y=canvas.height-player.height; player.vy=0;}
obstacles.forEach(o=>o.x-=obstacleSpeed);
obstacles=obstacles.filter(o=>o.x+o.width>0);
if(Math.random()<0.02+Math.max(0,points)/50000) addObstacle();
for(let o of obstacles){
if(o.type==='spike'){if(player.x<o.x+o.width && player.x+player.width>o.x && player.y<o.y+o.height && player.y+player.height>o.y){showQuestion(); break;}}
else{const rampTopY=o.y; const rampLeftX=o.x; const rampRightX=o.x+o.width;
if(player.x+player.width>rampLeftX && player.x<rampRightX){
if(player.y+player.height>rampTopY){player.y=rampTopY-player.height; player.vy=0;}}}}
if(points<-2000) triggerGameOver();
}

function drawGame(){
ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.fillStyle='red'; ctx.fillRect(player.x,player.y,player.width,player.height);
for(let o of obstacles){
if(o.type==='spike'){ctx.fillStyle='black'; ctx.fillRect(o.x,o.y,o.width,o.height);}
else{ctx.fillStyle='green'; ctx.beginPath(); ctx.moveTo(o.x,o.y+o.height); ctx.lineTo(o.x+o.width/2,o.y); ctx.lineTo(o.x+o.width,o.y+o.height); ctx.closePath(); ctx.fill();}}
ctx.fillStyle='white'; ctx.font='20px Arial'; ctx.fillText('Points: '+points,10,30);
}

function triggerGameOver(){
gameStarted=false; state="gameover"; gameOverScreen.style.display='flex';
finalPoints.innerText=`Your Points: ${points}`;
if(highScores.length<5 || points>highScores[highScores.length-1].score){
updateHighScores(points);
}
showHighScores(highScoreGameOverList);
}

// Loop
function loop(){
if(state==="cutscene"){updateCutscene(); drawCutscene();}
else if(state==="playing"){updateGame(); drawGame();}
requestAnimationFrame(loop);
}

// Start
loop();
window.addEventListener('keydown',e=>{if(e.code==='Space' && player && player.y+player.height>=canvas.height) player.vy=-10;});
startBtn.addEventListener('click',()=>{startScreen.style.display='none'; initGame();});
restartBtn.addEventListener('click',()=>{gameOverScreen.style.display='none'; initGame();});

})();
