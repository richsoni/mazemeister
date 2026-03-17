#!/usr/bin/env node

import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useInput, useStdout, useApp } from 'ink';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e = React.createElement;

const STATUS = {
  PLAYING:   'playing',
  PAUSED:    'paused',
  WON:       'won',
  GAME_OVER: 'gameOver',
  COMPLETE:  'complete',
};

function getEntityAt(entities, x, y) {
  return entities.find(en => en.x === x && en.y === y);
}

function isEnemy(entity) {
  return entity.onPlayerCollide === 'kill';
}

const CARDINAL_DIRS = [
  { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
];

// Symbols for rendering wall-following enemies by facing direction (N E S W)
const FACING_SYMBOLS = ['▲', '▶', '▼', '◀'];

// ─── Entity configuration ────────────────────────────────────────────────────
// movement:        key into MOVEMENT_BEHAVIORS
// onPlayerCollide: 'kill' | 'exit' | null
// onEnemyCollide:  key into ENEMY_INTERACTIONS (default 'ignore')
// initialFacing:   starting direction index 0=N 1=E 2=S 3=W (optional)
const ENTITY_CONFIG = {
  staticEnemy:  { templateSymbol: '1', renderSymbol: '■', color: 'red',     movement: 'static',      onPlayerCollide: 'kill', onEnemyCollide: 'ignore' },
  movingEnemy:  { templateSymbol: '2', renderSymbol: '♦', color: 'magenta', movement: 'random_walk', onPlayerCollide: 'kill', onEnemyCollide: 'ignore' },
  wallFollower: { templateSymbol: '3', renderSymbol: '▲', color: 'cyan',    movement: 'wall_follow', onPlayerCollide: 'kill', onEnemyCollide: 'bounce', initialFacing: 0 },
  exit:         { templateSymbol: 'E', renderSymbol: '⍟', color: 'yellow',  movement: 'static',      onPlayerCollide: 'exit', onEnemyCollide: 'ignore' },
};

// ─── Movement behaviors ──────────────────────────────────────────────────────
// Each function receives (entity, { maze, entities }) and returns the updated entity.
// `entities` reflects positions from the START of this tick (pre-move), so each
// entity sees a consistent snapshot when deciding where to go.
const MOVEMENT_BEHAVIORS = {
  static: (entity) => entity,

  random_walk: (entity, { maze, entities }) => {
    const valid = CARDINAL_DIRS.filter(({ x: dx, y: dy }) => {
      const nx = entity.x + dx, ny = entity.y + dy;
      return maze[ny]?.[nx] === ' ' &&
        !entities.some(other => other !== entity && other.x === nx && other.y === ny);
    });
    if (!valid.length) return entity;
    const move = valid[Math.floor(Math.random() * valid.length)];
    return { ...entity, x: entity.x + move.x, y: entity.y + move.y };
  },

  // Left-hand rule wall follower.
  // Always tries to turn left relative to current facing; falls back to
  // straight → right → reverse. In open space this produces tight clockwise
  // circles (because "left" is always blocked-or-open, driving a loop).
  // entity.facing: 0=N 1=E 2=S 3=W
  wall_follow: (entity, { maze, entities }) => {
    const facing = entity.facing ?? 0;
    const dirVectors = [
      { x:  0, y: -1 }, // 0 N
      { x:  1, y:  0 }, // 1 E
      { x:  0, y:  1 }, // 2 S
      { x: -1, y:  0 }, // 3 W
    ];
    // Priority: left of current facing, straight, right, back
    const tryOrder = [
      (facing + 3) % 4, // left
      facing,           // straight
      (facing + 1) % 4, // right
      (facing + 2) % 4, // back
    ];
    for (const dir of tryOrder) {
      const { x: dx, y: dy } = dirVectors[dir];
      const nx = entity.x + dx, ny = entity.y + dy;
      if (maze[ny]?.[nx] === ' ' &&
          !entities.some(other => other !== entity && other.x === nx && other.y === ny)) {
        return { ...entity, x: nx, y: ny, facing: dir };
      }
    }
    return entity; // completely boxed in
  },
};

// ─── Enemy–enemy interaction handlers ───────────────────────────────────────
// Called when two enemies land on the same cell after moving.
// Receives (newA, prevA, newB, prevB) — prev* are positions before this tick.
// Returns { a, b } with the resolved entity states.
// Resolution rule: if either entity specifies a non-'ignore' handler, that wins.
const ENEMY_INTERACTIONS = {
  ignore: (newA, _prevA, newB, _prevB) => ({ a: newA, b: newB }),

  // Both enemies bounce back to where they were and reverse facing (if applicable).
  bounce: (_newA, prevA, _newB, prevB) => ({
    a: { ...prevA, ...(prevA.facing !== undefined && { facing: (prevA.facing + 2) % 4 }) },
    b: { ...prevB, ...(prevB.facing !== undefined && { facing: (prevB.facing + 2) % 4 }) },
  }),
};

function resolveEnemyCollisions(newEntities, prevEntities) {
  const result = [...newEntities];
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (result[i].x !== result[j].x || result[i].y !== result[j].y) continue;
      const handlerKey = (result[i].onEnemyCollide !== 'ignore' ? result[i].onEnemyCollide : result[j].onEnemyCollide) ?? 'ignore';
      const handler = ENEMY_INTERACTIONS[handlerKey] ?? ENEMY_INTERACTIONS.ignore;
      const { a, b } = handler(result[i], prevEntities[i], result[j], prevEntities[j]);
      result[i] = a;
      result[j] = b;
    }
  }
  return result;
}

// Builds an entity object from config + position, including any behavior-specific
// initial state (e.g. facing direction for wall_follow).
function createEntity(config, x, y) {
  return {
    x, y,
    renderSymbol:    config.renderSymbol,
    color:           config.color,
    movement:        config.movement,
    onPlayerCollide: config.onPlayerCollide,
    onEnemyCollide:  config.onEnemyCollide ?? 'ignore',
    ...(config.initialFacing !== undefined && { facing: config.initialFacing }),
  };
}

function parseLevel(levelNumber) {
  const levelPath = path.join(__dirname, 'levels', `level${levelNumber}.txt`);
  const lines = fs.readFileSync(levelPath, 'utf8').trim().split('\n');
  const height = lines.length;
  const width = Math.max(...lines.map(l => l.length));
  const maze = [];
  const entities = [];
  let playerX = 0, playerY = 0, exitX = 0, exitY = 0;

  for (let y = 0; y < height; y++) {
    maze[y] = [];
    const line = lines[y] || '';
    for (let x = 0; x < width; x++) {
      const char = line[x] || ' ';
      if (char === 'O' || char === '0') {
        playerX = x; playerY = y; maze[y][x] = ' ';
      } else {
        let matched = false;
        for (const config of Object.values(ENTITY_CONFIG)) {
          if (char === config.templateSymbol) {
            entities.push(createEntity(config, x, y));
            if (config.onPlayerCollide === 'exit') { exitX = x; exitY = y; }
            maze[y][x] = ' ';
            matched = true;
            break;
          }
        }
        if (!matched) maze[y][x] = char;
      }
    }
  }

  return { levelNumber, maze, entities, playerX, playerY, exitX, exitY, width, height, status: STATUS.PLAYING };
}

function MazeGame({ initialLevel }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [state, setState] = useState(() => parseLevel(initialLevel));

  // The game loop interval is created once (empty dep array) but needs fresh state
  // each tick. stateRef.current is updated after every render, so reading it inside
  // the interval always gives the latest values without recreating the interval.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Game loop — created once, reads fresh state via ref
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.status !== STATUS.PLAYING) return;

      setState(prev => {
        const ctx = { maze: prev.maze, entities: prev.entities };
        const movedEntities = prev.entities.map(entity => {
          const behavior = MOVEMENT_BEHAVIORS[entity.movement];
          return behavior ? behavior(entity, ctx) : entity;
        });
        const newEntities = resolveEnemyCollisions(movedEntities, prev.entities);

        const hitPlayer = newEntities.some(en =>
          isEnemy(en) && en.x === prev.playerX && en.y === prev.playerY
        );

        return hitPlayer ? { ...prev, status: STATUS.GAME_OVER } : { ...prev, entities: newEntities };
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Level transition after winning
  useEffect(() => {
    if (state.status !== STATUS.WON) return;
    const timeout = setTimeout(() => {
      try {
        setState(parseLevel(state.levelNumber + 1));
      } catch {
        setState(prev => ({ ...prev, status: STATUS.COMPLETE }));
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [state.status, state.levelNumber]);

  useInput((input, key) => {
    if (state.status === STATUS.WON) return;

    if (state.status === STATUS.COMPLETE) {
      if (input === 'q') exit();
      return;
    }

    if (input === 'p' && state.status !== STATUS.GAME_OVER) {
      setState(prev => ({ ...prev, status: prev.status === STATUS.PAUSED ? STATUS.PLAYING : STATUS.PAUSED }));
      return;
    }

    if (state.status === STATUS.GAME_OVER) {
      if (input === 'r') setState(parseLevel(state.levelNumber));
      if (input === 'q') exit();
      return;
    }

    if (state.status === STATUS.PAUSED) return;

    let dx = 0, dy = 0;
    if (key.upArrow    || input === 'w') dy = -1;
    else if (key.downArrow  || input === 's') dy = 1;
    else if (key.leftArrow  || input === 'a') dx = -1;
    else if (key.rightArrow || input === 'd') dx = 1;
    else if (input === 'q') { exit(); return; }
    else return;

    setState(prev => {
      const nx = prev.playerX + dx, ny = prev.playerY + dy;
      if (prev.maze[ny]?.[nx] !== ' ') return prev;

      const hit = getEntityAt(prev.entities, nx, ny);
      if (hit && isEnemy(hit)) {
        return { ...prev, status: STATUS.GAME_OVER };
      }

      const nextStatus = (nx === prev.exitX && ny === prev.exitY) ? STATUS.WON : STATUS.PLAYING;
      return { ...prev, playerX: nx, playerY: ny, status: nextStatus };
    });
  });

  // Viewport / camera
  const BORDER_SIZE  = 2;  // green border columns on each side
  const VIEWPORT_PAD = BORDER_SIZE * 2;
  const MIN_VP_WIDTH  = 10;
  const MIN_VP_HEIGHT = 5;

  const vpWidth  = Math.max(MIN_VP_WIDTH,  (stdout.columns || 80) - VIEWPORT_PAD);
  const vpHeight = Math.max(MIN_VP_HEIGHT, (stdout.rows    || 24) - VIEWPORT_PAD);
  const { maze, entities, playerX, playerY, width, height, status, levelNumber } = state;
  const cameraX = Math.max(0, Math.min(width  - vpWidth,  playerX - Math.floor(vpWidth  / 2)));
  const cameraY = Math.max(0, Math.min(height - vpHeight, playerY - Math.floor(vpHeight / 2)));
  const rowCount = Math.min(height - cameraY, vpHeight);
  const colCount = Math.min(width  - cameraX, vpWidth);
  const border = ' '.repeat(colCount + 4);

  const STATUS_TEXT = {
    [STATUS.GAME_OVER]: 'Game Over! You hit a bad guy. Press R to restart, Q to quit.',
    [STATUS.WON]:       `Level ${levelNumber} complete! Loading next level...`,
    [STATUS.COMPLETE]:  `Congratulations! You completed all ${levelNumber - 1} levels! Press Q to exit.`,
    [STATUS.PAUSED]:    `Level ${levelNumber} - PAUSED. Press P to unpause, Q to quit.`,
    [STATUS.PLAYING]:   `Level ${levelNumber} - WASD or arrows to move. P to pause. Q to quit.`,
  };
  const statusText = STATUS_TEXT[status];

  const rows = Array.from({ length: rowCount }, (_, ri) => {
    const y = ri + cameraY;
    const cells = Array.from({ length: colCount }, (_, ci) => {
      const x = ci + cameraX;
      const entity = getEntityAt(entities, x, y);
      if (x === playerX && y === playerY) return e(Text, { key: x }, status === STATUS.GAME_OVER ? 'X' : '●');
      if (entity) {
        const sym = entity.facing !== undefined ? FACING_SYMBOLS[entity.facing] : entity.renderSymbol;
        return e(Text, { key: x, color: entity.color }, sym);
      }
      if (maze[y]?.[x] === '#')            return e(Text, { key: x, backgroundColor: 'gray' }, ' ');
      return                                      e(Text, { key: x }, maze[y]?.[x] || ' ');
    });

    return e(Box, { key: y },
      e(Text, { backgroundColor: 'green' }, '  '),
      ...cells,
      e(Text, { backgroundColor: 'green' }, '  '),
    );
  });

  return e(Box, { flexDirection: 'column' },
    e(Text, { backgroundColor: 'green' }, border),
    ...rows,
    e(Text, { backgroundColor: 'green' }, border),
    e(Text, null, statusText),
  );
}

const levelArg = process.argv.slice(2).find(arg => arg.startsWith('--level='));
const levelNumber = levelArg
  ? parseInt(levelArg.split('=')[1])
  : (process.argv[2] ? parseInt(process.argv[2]) : 1);

render(e(MazeGame, { initialLevel: levelNumber }));
