#!/usr/bin/env node

import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useInput, useStdout, useApp } from 'ink';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEntityAt, isEnemy, createEntity, FACING_SYMBOLS } from './utils.js';
import { ENTITY_CONFIG, MOVEMENT_BEHAVIORS, resolveEnemyCollisions } from './enemies/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e = React.createElement;

const STATUS = {
  PLAYING:   'playing',
  PAUSED:    'paused',
  WON:       'won',
  GAME_OVER: 'gameOver',
  COMPLETE:  'complete',
};

// Exit tile config lives here since it's not an enemy
const EXIT_CONFIG = { templateSymbol: 'E', renderSymbol: '⍟', color: 'yellow', movement: 'static', onPlayerCollide: 'exit', onEnemyCollide: 'ignore' };
const ALL_ENTITY_CONFIG = { ...ENTITY_CONFIG, exit: EXIT_CONFIG };

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
        for (const config of Object.values(ALL_ENTITY_CONFIG)) {
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
