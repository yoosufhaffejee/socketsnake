const BG_COLOUR = 'black';
const SNAKE1_COLOUR = 'green';
const SNAKE2_COLOUR = 'yellow';
const FOOD_COLOUR = 'red';

// Construct the socket.io connection URL dynamically
const socketUrl = window.location.protocol + '//' + location.hostname + ':3000';
const socket = io(socketUrl);

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);

// Touch event handling
let touchstartX = 0;
let touchstartY = 0;
let touchendX = 0;
let touchendY = 0;
let isTouchDevice = false;

// Detect if the device is touch-enabled
if ('ontouchstart' in window || navigator.maxTouchPoints) {
  isTouchDevice = true;
  gameScreen.addEventListener('touchstart', handleTouchStart);
  gameScreen.addEventListener('touchend', handleTouchEnd);
} else {
  // Add keyboard event listeners for desktop
  document.addEventListener('keydown', keydown);
}

function newGame() {
  socket.emit('newGame');
  init();
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit('joinGame', code);
  init();
}

function init() {
  initialScreen.style.display = "none";
  gameScreen.style.display = "block";

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  canvas.width = canvas.height = 600;

  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  gameActive = true;
}

function handleTouchStart(event) {
  touchstartX = event.changedTouches[0].screenX;
  touchstartY = event.changedTouches[0].screenY;
}

function handleTouchEnd(event) {
  touchendX = event.changedTouches[0].screenX;
  touchendY = event.changedTouches[0].screenY;
  handleSwipe();
}

function handleSwipe() {
  if (!isTouchDevice) {
    return; // Only handle swipe gestures on touch devices
  }

  const deltaX = touchendX - touchstartX;
  const deltaY = touchendY - touchstartY;
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (deltaX > 0) {
      // Swipe right
      socket.emit('keydown', 39); // Example keyCode for right arrow key
    } else {
      // Swipe left
      socket.emit('keydown', 37); // Example keyCode for left arrow key
    }
  } else {
    // Vertical swipe
    if (deltaY > 0) {
      // Swipe down
      socket.emit('keydown', 40); // Example keyCode for down arrow key
    } else {
      // Swipe up
      socket.emit('keydown', 38); // Example keyCode for up arrow key
    }
  }
}

function keydown(e) {
  socket.emit('keydown', e.keyCode);
}

function paintGame(state) {
  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;

  ctx.fillStyle = FOOD_COLOUR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.players[0], size, SNAKE1_COLOUR);
  paintPlayer(state.players[1], size, SNAKE2_COLOUR);
}

function paintPlayer(playerState, size, colour) {
  const snake = playerState.snake;

  ctx.fillStyle = colour;
  for (let cell of snake) {
    ctx.fillRect(cell.x * size, cell.y * size, size, size);
  }
}

function handleInit(number) {
  playerNumber = number;
}

function handleGameState(gameState) {
  if (!gameActive) {
    return;
  }
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
  if (!gameActive) {
    return;
  }
  data = JSON.parse(data);

  gameActive = false;

  if (data.winner === playerNumber) {
    alert('You Win!');
  } else {
    alert('You Lose :(');
  }
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

function handleUnknownCode() {
  reset();
  alert('Unknown Game Code')
}

function handleTooManyPlayers() {
  reset();
  alert('This game is already in progress');
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = '';
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
}

