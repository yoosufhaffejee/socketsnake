const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors'); // Import cors middleware

const { initGame, gameLoop, getUpdatedVelocity, getVelocityAfterSwipe } = require('./game');
const { FRAME_RATE } = require('./constants');
const { makeid } = require('./utils');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// CORS middleware setup
app.use(cors());

const state = {};
const clientRooms = {};

// Temp touch vars
var touchstartX = 0;
var touchstartY = 0;
var touchendX = 0;
var touchendY = 0;

io.on('connection', client => {

  client.on('keydown', handleKeydown);
  client.on('touchstart', touchStart);
  client.on('touchend', touchEnd);
  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame);

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms[roomName];

    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    if (numClients === 0) {
      client.emit('unknownCode');
      return;
    } else if (numClients > 1) {
      client.emit('tooManyPlayers');
      return;
    }

    clientRooms[client.id] = roomName;

    client.join(roomName);
    client.number = 2;
    client.emit('init', 2);
    
    startGameInterval(roomName);
  }

  function handleNewGame() {
    let roomName = makeid(4);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);

    state[roomName] = initGame();

    client.join(roomName);
    client.number = 1;
    client.emit('init', 1);
  }

  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }

    let playerV = state[roomName].players[client.number - 1].vel;
    const vel = getUpdatedVelocity(playerV, keyCode);

    if (vel) {
      state[roomName].players[client.number - 1].vel = vel;
    }
  }
});

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName]);
    
    if (!winner) {
      emitGameState(roomName, state[roomName])
    } else {
      emitGameOver(roomName, winner);
      state[roomName] = null;
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}

function touchStart(e)
{
  touchstartX = e.screenX;
  touchstartY = e.screenY;
}

function touchEnd(e)
{
  touchendX = e.screenX;
  touchendY = e.screenY;
  handleSwipe();
}

function handleSwipe() {
  const roomName = clientRooms[client.id];
  if (!roomName) {
    return;
  }

  let playerV = state[roomName].players[client.number - 1].vel;
  let vel;

  // Up
  if (touchendY > touchstartY) {
    vel = getVelocityAfterSwipe(playerV, 1);
  }
  // Down
  if (touchendY < touchstartY) {
    vel = getVelocityAfterSwipe(playerV, 2);
  }
  // Left
  if (touchendX < touchstartX) {
    vel = getVelocityAfterSwipe(playerV, 3);
  }
  // Right
  if (touchendX > touchstartX) {
    vel = getVelocityAfterSwipe(playerV, 4);
  }
  // Tap
  if (touchendY == touchstartY) {
    // :TODO
  }

  if (vel) {
    state[roomName].players[client.number - 1].vel = vel;
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

