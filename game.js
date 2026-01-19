const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const waveCountEl = document.getElementById("waveCount");
const alienCountEl = document.getElementById("alienCount");
const cakeHealthEl = document.getElementById("cakeHealth");
const candyCountEl = document.getElementById("candyCount");
const birthdayMessage = document.getElementById("birthdayMessage");
const wishText = document.getElementById("wishText");

const spaceshipImg = new Image();
spaceshipImg.src = "sprites/ship.png";

const alienImg1 = new Image();
alienImg1.src = "sprites/alien_1.png";

const alienImg2 = new Image();
alienImg2.src = "sprites/alien_2.png";

const alienImg3 = new Image();
alienImg3.src = "sprites/alien_3.png";

let gameActive = false;
let gamePaused = false;
let lastTime = 0;
let wave = 1;
let aliensDefeated = 0;
let cakeHealth = 100;
let candies = 50;
let gameOver = false;

let aliens = [];
let candiesShot = [];
let explosions = [];
let stars = [];

const root = document.documentElement;
const computedStyles = getComputedStyle(root);

const whiteMain = computedStyles.getPropertyValue("--white-main");
const greenMain = computedStyles.getPropertyValue("--green-main");
const turquoiseMain = computedStyles.getPropertyValue("--turquoise-main");
const redMain = computedStyles.getPropertyValue("--red-main");
const bgMessage = computedStyles.getPropertyValue("--bg-message");

// player spaceship
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 80,
  width: 65,
  height: 65,
  speed: 6,
  isMovingLeft: false,
  isMovingRight: false,
  lastShot: 0,
  shotDelay: 300, // ms
};

// generate background stars
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    brightness: Math.random() * 0.5 + 0.5,
  });
}

// birthday cake
const cake = {
  x: canvas.width / 2 - 75,
  y: canvas.height - 40,
  width: 150,
  height: 30,
  color: "#ff66b3",
  frostingColor: "#ffccff",
  candleColor: "#ffff66",
};

// initialize alien wave
function initWave() {
  aliens = [];
  const alienRows = 3;
  const alienCols = 6;
  const alienWidth = 60;
  const alienHeight = 60;
  const horizontalSpacing = 60;
  const verticalSpacing = 60;
  const startX = (canvas.width - alienCols * horizontalSpacing) / 2 + 20;
  const startY = 50;

  // create aliens in grid pattern
  for (let row = 0; row < alienRows; row++) {
    for (let col = 0; col < alienCols; col++) {
      let alienImage;
      if (row % 3 === 0) {
        alienImage = alienImg1;
      } else if (row % 3 === 1) {
        alienImage = alienImg2;
      } else {
        alienImage = alienImg3;
      }

      aliens.push({
        x: startX + col * horizontalSpacing,
        y: startY + row * verticalSpacing,
        width: alienWidth,
        height: alienHeight,
        speed: 0.5 + wave * 0.1,
        direction: 1,
        image: alienImage,
        lastShot: Math.random() * 2000,
        shotDelay: 5000 + Math.random() * 1000,
        health: 1,
      });
    }
  }
}

// !! Draw birthday cake
function drawCake() {
  // Cake base
  ctx.fillStyle = cake.color;
  ctx.fillRect(cake.x, cake.y, cake.width, cake.height);

  // Frosting
  ctx.fillStyle = cake.frostingColor;
  ctx.fillRect(cake.x, cake.y, cake.width, cake.height * 0.3);

  // Cake layers
  ctx.fillStyle = "#ff3385";
  ctx.fillRect(cake.x + 5, cake.y + 5, cake.width - 10, cake.height * 0.15);

  // Candles
  const candleCount = 5;
  const candleSpacing = cake.width / (candleCount + 1);
  for (let i = 1; i <= candleCount; i++) {
    const candleX = cake.x + candleSpacing * i - 3;

    // Candle
    ctx.fillStyle = cake.candleColor;
    ctx.fillRect(candleX, cake.y - 20, 6, 20);

    // Flame
    ctx.fillStyle = "#ff9900";
    ctx.fillRect(candleX + 1, cake.y - 25, 4, 8);
  }

  // Cake plate
  ctx.fillStyle = "#cccccc";
  ctx.fillRect(cake.x - 10, cake.y + cake.height, cake.width + 20, 10);
}

// draw candy
function drawCandy(x, y, size, color) {
  // candy body
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);

  // candy stripes
  ctx.fillStyle = whiteMain;
  ctx.fillRect(x, y, size, size * 0.2);
  ctx.fillRect(x, y + size * 0.4, size, size * 0.2);
  ctx.fillRect(x, y + size * 0.8, size, size * 0.2);
}

// draw explosion effect
function drawExplosion(x, y, radius, life) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(255, 255, 100, ${life})`);
  gradient.addColorStop(0.7, `rgba(255, 100, 0, ${life * 0.7})`);
  gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

// draw background stars
function drawStars() {
  ctx.fillStyle = whiteMain;
  stars.forEach((star) => {
    ctx.globalAlpha = star.brightness;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
  ctx.globalAlpha = 1;
}

// player shooting
function shootCandy() {
  const currentTime = Date.now();
  if (currentTime - player.lastShot > player.shotDelay && candies > 0) {
    candiesShot.push({
      x: player.x + player.width / 2 - 5,
      y: player.y,
      width: 10,
      height: 20,
      speed: 8,
      color: greenMain,
    });
    player.lastShot = currentTime;
    candies--;
    candyCountEl.textContent = candies;
  }
}

// alien shooting
function alienShoot(alien) {
  const currentTime = Date.now();
  if (currentTime - alien.lastShot > alien.shotDelay && Math.random() < 0.01) {
    candiesShot.push({
      x: alien.x + alien.width / 2 - 5,
      y: alien.y + alien.height,
      width: 10,
      height: 20,
      speed: -5,
      color: redMain,
    });
    alien.lastShot = currentTime;
  }
}

// check collisions
function checkCollisions() {
  // check candy collisions with aliens
  for (let i = candiesShot.length - 1; i >= 0; i--) {
    const candy = candiesShot[i];

    // player candy hits alien
    if (candy.speed > 0) {
      for (let j = aliens.length - 1; j >= 0; j--) {
        const alien = aliens[j];
        if (
          candy.x < alien.x + alien.width &&
          candy.x + candy.width > alien.x &&
          candy.y < alien.y + alien.height &&
          candy.y + candy.height > alien.y
        ) {
          // hit
          aliens.splice(j, 1);
          candiesShot.splice(i, 1);
          aliensDefeated++;
          alienCountEl.textContent = aliensDefeated;

          // create explosion
          explosions.push({
            x: alien.x + alien.width / 2,
            y: alien.y + alien.height / 2,
            radius: 20,
            life: 1,
          });

          break;
        }
      }
    }
    // alien candy hits cake
    else if (candy.speed < 0) {
      if (
        candy.x < cake.x + cake.width &&
        candy.x + candy.width > cake.x &&
        candy.y < cake.y + cake.height &&
        candy.y + candy.height > cake.y
      ) {
        // hit cake
        candiesShot.splice(i, 1);
        cakeHealth -= 2;
        cakeHealthEl.textContent = `${cakeHealth}%`;

        if (cakeHealth <= 0) {
          cakeHealth = 0;
          gameOver = true;
          cakeHealthEl.textContent = "0%";
        }

        // create explosion
        explosions.push({
          x: candy.x + candy.width / 2,
          y: candy.y + candy.height / 2,
          radius: 15,
          life: 1,
        });
      }
    }

    // remove candies that go off screen
    if (candy.y < -20 || candy.y > canvas.height + 20) {
      candiesShot.splice(i, 1);
    }
  }

  // check if aliens hit the cake
  for (let i = aliens.length - 1; i >= 0; i--) {
    const alien = aliens[i];
    if (alien.y + alien.height > cake.y) {
      // alien reached the cake
      aliens.splice(i, 1);
      cakeHealth -= 15;
      cakeHealthEl.textContent = `${cakeHealth}%`;

      if (cakeHealth <= 0) {
        cakeHealth = 0;
        gameOver = true;
        cakeHealthEl.textContent = "0%";
      }

      // create explosion
      explosions.push({
        x: alien.x + alien.width / 2,
        y: cake.y,
        radius: 25,
        life: 1,
      });
    }
  }
}

// update game objects
function updateGame() {
  if (gamePaused || !gameActive || gameOver) return;

  // move player
  if (player.isMovingLeft && player.x > 0) {
    player.x -= player.speed;
  }
  if (player.isMovingRight && player.x < canvas.width - player.width) {
    player.x += player.speed;
  }

  // update aliens
  let changeDirection = false;
  aliens.forEach((alien) => {
    alien.x += alien.speed * alien.direction;

    // check if alien hits edge
    if (alien.x <= 0 || alien.x + alien.width >= canvas.width) {
      changeDirection = true;
    }

    // alien shooting
    alienShoot(alien);
  });

  // change alien direction if any hit edge
  if (changeDirection) {
    aliens.forEach((alien) => {
      alien.direction *= -1;
      alien.y += 20;
    });
  }

  // update candies
  candiesShot.forEach((candy) => {
    candy.y -= candy.speed;
  });

  // update explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].radius += 1;
    explosions[i].life -= 0.03;
    if (explosions[i].life <= 0) {
      explosions.splice(i, 1);
    }
  }

  checkCollisions();

  // check if wave is cleared
  if (aliens.length === 0) {
    wave++;
    waveCountEl.textContent = wave;

    // show birthday message after wave 3
    if (wave > 3) {
      showBirthdayMessage();
      gameActive = false;
      return;
    }

    // start next wave
    initWave();
    candies += 10 * wave; // reward player
    candyCountEl.textContent = candies;
  }

  // move stars for parallax effect
  stars.forEach((star) => {
    star.y += 0.5;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });
}

function draw() {
  // clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawStars();

  drawCake();

  explosions.forEach((explosion) => {
    drawExplosion(explosion.x, explosion.y, explosion.radius, explosion.life);
  });

  candiesShot.forEach((candy) => {
    drawCandy(candy.x, candy.y, candy.width, candy.color);
  });

  // draw aliens
  aliens.forEach((alien) => {
    ctx.drawImage(alien.image, alien.x, alien.y, alien.width, alien.height);
  });

  // draw spaceship
  ctx.drawImage(spaceshipImg, player.x, player.y, player.width, player.height);

  // draw game over message
  if (gameOver) {
    ctx.fillStyle = bgMessage;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = redMain;
    ctx.font = "bold 48px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = whiteMain;
    ctx.font = "24px Courier New";
    ctx.fillText(
      `You defeated ${aliensDefeated} aliens!`,
      canvas.width / 2,
      canvas.height / 2 + 30
    );
    ctx.fillText(
      "Press RESTART to play again",
      canvas.width / 2,
      canvas.height / 2 + 70
    );
  }

  // draw pause message
  if (gamePaused) {
    ctx.fillStyle = bgMessage;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = turquoiseMain;
    ctx.font = "bold 48px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("GAME PAUSED", canvas.width / 2, canvas.height / 2);
  }
}

// game loop
function gameLoop() {
  updateGame();
  draw();

  requestAnimationFrame(gameLoop);
}

// show birthday message
function showBirthdayMessage() {
  const wishes = [
    "May your day be as sweet as this birthday cake!",
    "Hope your birthday is out of this world!",
    "Another year older, another year more awesome!",
  ];

  const randomWish = wishes[Math.floor(Math.random() * wishes.length)];
  wishText.textContent = randomWish;

  birthdayMessage.classList.add("active");
}

// start game
function startGame() {
  if (!gameActive || gameOver) {
    // reset game state
    gameActive = true;
    gamePaused = false;
    gameOver = false;
    wave = 1;
    aliensDefeated = 0;
    cakeHealth = 100;
    candies = 50;

    // reset ui
    waveCountEl.textContent = wave;
    alienCountEl.textContent = aliensDefeated;
    cakeHealthEl.textContent = `${cakeHealth}%`;
    candyCountEl.textContent = candies;

    // hide birthday message
    birthdayMessage.classList.remove("active");

    // initialize game objects
    candiesShot = [];
    explosions = [];
    initWave();

    // center player
    player.x = canvas.width / 2 - player.width / 2;
  }
}

// pause/resume game
function togglePause() {
  if (!gameActive) return;
  gamePaused = !gamePaused;
}

// restart game
function restartGame() {
  gameOver = true;
  startGame();
}

// event listeners for controls
document.addEventListener("keydown", (e) => {
  if (!gameActive || gamePaused || gameOver) return;

  switch (e.key) {
    case "a":
    case "A":
    case "ArrowLeft":
      player.isMovingLeft = true;
      break;
    case "d":
    case "D":
    case "ArrowRight":
      player.isMovingRight = true;
      break;
    case " ":
      shootCandy();
      e.preventDefault(); // prevent space from scrolling
      break;
    case "p":
    case "P":
      togglePause();
      break;
  }
});

document.addEventListener("keyup", (e) => {
  switch (e.key) {
    case "a":
    case "A":
    case "ArrowLeft":
      player.isMovingLeft = false;
      break;
    case "d":
    case "D":
    case "ArrowRight":
      player.isMovingRight = false;
      break;
  }
});

// button event listeners
startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);
restartBtn.addEventListener("click", restartGame);

// initialize and start game
initWave();
gameLoop(0);

// instructions for touch devices
canvas.addEventListener("touchstart", (e) => {
  if (!gameActive || gamePaused || gameOver) return;

  const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;

  // move player to touch position
  player.x = touchX - player.width / 2;

  // keep player within bounds
  if (player.x < 0) player.x = 0;
  if (player.x > canvas.width - player.width)
    player.x = canvas.width - player.width;

  // shoot candy
  shootCandy();

  e.preventDefault();
});

canvas.addEventListener("touchmove", (e) => {
  if (!gameActive || gamePaused || gameOver) return;

  const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;

  // move player to touch position
  player.x = touchX - player.width / 2;

  // keep player within bounds
  if (player.x < 0) player.x = 0;
  if (player.x > canvas.width - player.width)
    player.x = canvas.width - player.width;

  e.preventDefault();
});
