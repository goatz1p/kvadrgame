const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

let playerName = "";
let gameInterval = null;
let power = 50;
let timeSeconds = 0;
let keys = {};
let playerY;
let walls = [];
let batteries = [];
let gameOver = false;

const images = {
  player: "img/kvad.png",
  background: "img/fon.jpg"
};

const loadedImages = {};

function preloadImages(callback) {
  let loadedCount = 0;
  const imageCount = Object.keys(images).length;

  for (const [key, src] of Object.entries(images)) {
    const img = new Image();
    img.onload = () => {
      loadedImages[key] = img;
      loadedCount++;
      if (loadedCount >= imageCount) callback();
    };
    img.src = src;
  }
}

const welcomeScreen = document.getElementById("welcome-screen");
const resultScreen = document.getElementById("result-screen");
const loseScreen = document.getElementById("lose-screen");
const nameDisplay = document.getElementById("name");
const timeDisplay = document.getElementById("time");
const powerLevel = document.getElementById("power-level");
const resultText = document.getElementById("result-text");
const loseResult = document.getElementById("lose-result");

document.getElementById("player-name").addEventListener("input", () => {
  const input = document.getElementById("player-name").value;
  document.getElementById("start-btn").disabled = input.trim() === "";
});

document.getElementById("start-btn").addEventListener("click", () => {
  playerName = document.getElementById("player-name").value;
  startGame();
});

function startGame() {
  welcomeScreen.style.display = "none";
  resultScreen.style.display = "none";
  loseScreen.style.display = "none";

  power = 50;
  timeSeconds = 0;
  walls = [];
  batteries = [];
  gameOver = false;
  playerY = canvas.height / 2;

  nameDisplay.textContent = "Имя: " + playerName;

  updatePowerBar();

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(() => {
    timeSeconds++;
    updateTime();
    power--;
    updatePowerBar();
    if (power <= 0) endGame();
  }, 1000);

  requestAnimationFrame(gameLoop);
}

function updateTime() {
  const min = Math.floor(timeSeconds / 60).toString().padStart(2, "0");
  const sec = (timeSeconds % 60).toString().padStart(2, "0");
  timeDisplay.textContent = "Время: " + min + ":" + sec;
}

function updatePowerBar() {
  powerLevel.style.width = power + "%";
  if (power < 20) powerLevel.style.backgroundColor = "red";
  else if (power < 40) powerLevel.style.backgroundColor = "orange";
  else powerLevel.style.backgroundColor = "green";
}

function gameLoop() {
  if (gameOver) return;

  ctx.drawImage(loadedImages.background, 0, 0, canvas.width, canvas.height);

  drawPlayer();
  generateWalls();
  drawWalls();
  checkCollisions();

  generateBatteries();
  drawBatteries();
  collectBatteries();

  requestAnimationFrame(gameLoop);
}

function drawPlayer() {
  ctx.drawImage(loadedImages.player, 50, playerY - 25, 50, 50);
}

function generateWalls() {
  if (walls.length === 0 || walls[walls.length - 1].x < canvas.width - 300) {
    const wallHeight = Math.floor(Math.random() * 400) + 100;
    const wallTop = Math.random() > 0.5 ? 0 : canvas.height - wallHeight;
    walls.push({ x: canvas.width, y: wallTop, height: wallHeight });
  }
}

function drawWalls() {
  ctx.fillStyle = "gray";
  for (let w of walls) {
    w.x -= 4;
    ctx.fillRect(w.x, w.y, 50, w.height);
  }
}

function generateBatteries() {
  if (
    batteries.length === 0 ||
    batteries[batteries.length - 1].x < canvas.width - 300
  ) {
    let safeY = 0;
    let found = false;
    while (!found && walls.length > 0) {
      const lastWall = walls[walls.length - 1];
      safeY = Math.random() * (canvas.height - 50);
      if (
        safeY + 25 > lastWall.y &&
        safeY - 25 < lastWall.y + lastWall.height
      ) {
        continue;
      } else {
        found = true;
      }
    }
    if (found) {
      batteries.push({ x: canvas.width, y: safeY });
    }
  }
}

function drawBatteries() {
  ctx.fillStyle = "yellow";
  for (let b of batteries) {
    b.x -= 4;
    ctx.beginPath();
    ctx.arc(b.x + 15, b.y + 15, 15, 0, Math.PI * 2);
    ctx.fill();
  }
}

function collectBatteries() {
  for (let i = 0; i < batteries.length; i++) {
    const b = batteries[i];
    if (
      b.x < 100 &&
      b.x + 30 > 50 &&
      b.y > playerY - 50 &&
      b.y < playerY + 50
    ) {
      power += 5;
      if (power > 100) power = 100;
      updatePowerBar();
      batteries.splice(i, 1);
    }
  }
}

function checkCollisions() {
  const playerTop = playerY - 25;
  const playerBottom = playerY + 25;

  for (let w of walls) {
    if (
      w.x < 100 &&
      w.x + 50 > 50 &&
      ((w.y + w.height > playerTop && w.y < playerBottom) ||
       playerTop < 0 ||
       playerBottom > canvas.height)
    ) {
      endLose();
    }
  }
}

function endGame() {
  gameOver = true;
  resultText.innerHTML = `
    Имя: ${playerName}<br/>
    Время: ${Math.floor(timeSeconds / 60)}:${(timeSeconds % 60).toString().padStart(2, "0")}<br/>
    Заряд: ${power}%
  `;
  resultScreen.style.display = "block";
}

function endLose() {
  gameOver = true;
  loseResult.innerHTML = `
    Имя: ${playerName}<br/>
    Время: ${Math.floor(timeSeconds / 60)}:${(timeSeconds % 60).toString().padStart(2, "0")}
  `;
  loseScreen.style.display = "block";
}

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

setInterval(() => {
  const speed = 10;
  if (keys["w"] && playerY > 0) playerY -= speed;
  if (keys["s"] && playerY < canvas.height) playerY += speed;
  if (keys["ц"] && playerY > 0) playerY -= speed;
  if (keys["ы"] && playerY < canvas.height) playerY += speed;
}, 30);

document.getElementById("restart-btn").addEventListener("click", () => {
  resultScreen.style.display = "none";
  startGame();
});
document.getElementById("restart-btn-lose").addEventListener("click", () => {
  loseScreen.style.display = "none";
  startGame();
});

preloadImages(() => {
  console.log("Все изображения загружены!");
});