const { GRID_SIZE } = require('./constants');

module.exports = {
  initGame,
  gameLoop,
  getUpdatedVelocity,
  getVelocityAfterSwipe,
}

function initGame() {
  const state = createGameState()
  randomFood(state);
  return state;
}

function createGameState() {
  return {
    players: [{
      pos: {
        x: 3,
        y: 10,
      },
      vel: {
        x: 0,
        y: 0,
      },
      snake: [
        {x: 2, y: 10},
        {x: 3, y: 10},
      ],
    }, {
      pos: {
        x: 18,
        y: 10,
      },
      vel: {
        x: 0,
        y: 0,
      },
      snake: [
        {x: 19, y: 10},
        {x: 18, y: 10},
      ],
    }],
    food: {},
    gridsize: GRID_SIZE,
  };
}

function gameLoop(state) {
  if (!state) {
    return;
  }

  state.players.forEach(player => {
    player.pos.x += player.vel.x;
    player.pos.y += player.vel.y;
    wallTeleport(player);
    eatFood(state, player);
    chopTail(player);
  });

  return false;
}

function wallTeleport(player)
{
  if(player.pos.x<0){
    player.pos.x=GRID_SIZE;
  }
  else if(player.pos.x===GRID_SIZE){
      player.pos.x=0;
  }
  else if(player.pos.y<0){
      player.pos.y=GRID_SIZE;
  }
  else if(player.pos.y===GRID_SIZE){
      player.pos.y=0;
  }
}

function eatFood(state, player)
{
  if (state.food.x === player.pos.x && state.food.y === player.pos.y) {
    player.snake.push({ ...player.pos });
    player.pos.x += player.vel.x;
    player.pos.y += player.vel.y;
    randomFood(state);
  }
}

function chopTail(snake)
{
  if (snake.vel.x || snake.vel.y) {
    let count = 0;
    for (let cell of snake.snake) {
      count++;
      if (cell.x === snake.pos.x && cell.y === snake.pos.y) {
        let penalty = snake.snake.length - 1 - count;
        snake.snake.splice(snake.snake[cell], penalty);
        break;
      }
    }

    snake.snake.push({ ...snake.pos });
    snake.snake.shift();
  }
}

function randomFood(state) {
  food = {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  }

  for (let cell of state.players[0].snake) {
    if (cell.x === food.x && cell.y === food.y) {
      return randomFood(state);
    }
  }

  for (let cell of state.players[1].snake) {
    if (cell.x === food.x && cell.y === food.y) {
      return randomFood(state);
    }
  }

  state.food = food;
}

function getUpdatedVelocity(playerVelocity, keyCode) {
  // WASD Keycode cases
  switch (keyCode) {
    case 87: {return moveUp(playerVelocity);}
    case 83: {return moveDown(playerVelocity);}
    case 65: {return moveLeft(playerVelocity);}
    case 68: {return moveRight(playerVelocity);}
  }
}

function getVelocityAfterSwipe(playerVelocity, dir)
{
  switch(dir)
  {
    // Dir 1,2,3,4 cases
    case 1: {return moveUp(playerVelocity);}
    case 2: {return moveDown(playerVelocity);}
    case 3: {return moveLeft(playerVelocity);}
    case 4: {return moveRight(playerVelocity);}
  }
}

function moveUp(vel)
{
  if(vel.y==1)
  {
    return;
  }
  return { x: 0, y: -1 };
}

function moveDown(vel)
{
  if(vel.y==-1)
  {
    return;
  }
  return { x: 0, y: 1 };
}

function moveLeft(vel)
{
  if(vel.x==1)
  {
    return;
  }
  return { x: -1, y: 0 };
}

function moveRight(vel)
{
  if(vel.x==-1)
  {
    return;
  }
  return { x: 1, y: 0 };
}