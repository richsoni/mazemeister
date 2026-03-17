#!/usr/bin/env node

import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useInput, useStdout, useApp } from 'ink';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const e = React.createElement;

const ENTITY_CONFIG = {
  staticEnemy: { templateSymbol: '1', renderSymbol: '■', gameFunction: 'kill',      color: 'red'     },
  movingEnemy: { templateSymbol: '2', renderSymbol: '♦', gameFunction: 'kill_move', color: 'magenta' },
  exit:        { templateSymbol: 'E', renderSymbol: '⍟', gameFunction: 'exit',      color: 'yellow'  },
};

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
            entities.push({ x, y, renderSymbol: config.renderSymbol, gameFunction: config.gameFunction, color: config.color });
            if (config.gameFunction === 'exit') { exitX = x; exitY = y; }
            maze[y][x] = ' ';
            matched = true;
            break;
          }
        }
        if (!matched) maze[y][x] = char;
      }
    }
  }

  return { levelNumber, maze, entities, playerX, playerY, exitX, exitY, width, height, won: false, gameOver: false, paused: false, gameComplete: false };
}

function MazeGame({ initialLevel }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [state, setState] = useState(() => parseLevel(initialLevel));

  // Keep ref in sync for game loop (avoids stale closures)
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Game loop — created once, reads fresh state via ref
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      if (s.gameOver || s.won || s.paused) return;

      setState(prev => {
        const newEntities = prev.entities.map(entity => {
          if (entity.gameFunction !== 'kill_move') return entity;
          const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
          const valid = dirs.filter(({ x: dx, y: dy }) => {
            const nx = entity.x + dx, ny = entity.y + dy;
            return prev.maze[ny]?.[nx] === ' ' &&
              !prev.entities.some(other => other !== entity && other.x === nx && other.y === ny);
          });
          if (!valid.length) return entity;
          const move = valid[Math.floor(Math.random() * valid.length)];
          return { ...entity, x: entity.x + move.x, y: entity.y + move.y };
        });

        const hitPlayer = newEntities.some(en =>
          (en.gameFunction === 'kill' || en.gameFunction === 'kill_move') &&
          en.x === prev.playerX && en.y === prev.playerY
        );

        return hitPlayer ? { ...prev, gameOver: true } : { ...prev, entities: newEntities };
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Level transition after winning
  useEffect(() => {
    if (!state.won) return;
    const timeout = setTimeout(() => {
      try {
        setState(parseLevel(state.levelNumber + 1));
      } catch {
        setState(prev => ({ ...prev, won: false, gameComplete: true }));
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [state.won, state.levelNumber]);

  useInput((input, key) => {
    if (state.won) return;

    if (state.gameComplete) {
      if (input === 'q') exit();
      return;
    }

    if (input === 'p' && !state.gameOver) {
      setState(prev => ({ ...prev, paused: !prev.paused }));
      return;
    }

    if (state.gameOver) {
      if (input === 'r') setState(parseLevel(state.levelNumber));
      if (input === 'q') exit();
      return;
    }

    if (state.paused) return;

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

      const hit = prev.entities.find(en => en.x === nx && en.y === ny);
      if (hit && (hit.gameFunction === 'kill' || hit.gameFunction === 'kill_move')) {
        return { ...prev, gameOver: true };
      }

      return { ...prev, playerX: nx, playerY: ny, won: nx === prev.exitX && ny === prev.exitY };
    });
  });

  // Viewport / camera
  const vpWidth  = Math.max(10, (stdout.columns || 80) - 4);
  const vpHeight = Math.max(5,  (stdout.rows    || 24) - 4);
  const { maze, entities, playerX, playerY, width, height, gameOver, won, paused, gameComplete, levelNumber } = state;
  const cameraX = Math.max(0, Math.min(width  - vpWidth,  playerX - Math.floor(vpWidth  / 2)));
  const cameraY = Math.max(0, Math.min(height - vpHeight, playerY - Math.floor(vpHeight / 2)));
  const rowCount = Math.min(height - cameraY, vpHeight);
  const colCount = Math.min(width  - cameraX, vpWidth);
  const border = ' '.repeat(colCount + 4);

  const statusText = gameOver     ? 'Game Over! You hit a bad guy. Press R to restart, Q to quit.'
    : won          ? `Level ${levelNumber} complete! Loading next level...`
    : gameComplete ? `Congratulations! You completed all ${levelNumber - 1} levels! Press Q to exit.`
    : paused       ? `Level ${levelNumber} - PAUSED. Press P to unpause, Q to quit.`
    :                `Level ${levelNumber} - WASD or arrows to move. P to pause. Q to quit.`;

  const rows = Array.from({ length: rowCount }, (_, ri) => {
    const y = ri + cameraY;
    const cells = Array.from({ length: colCount }, (_, ci) => {
      const x = ci + cameraX;
      const entity = entities.find(en => en.x === x && en.y === y);
      if (x === playerX && y === playerY) return e(Text, { key: x }, gameOver ? 'X' : '●');
      if (entity)                          return e(Text, { key: x, color: entity.color }, entity.renderSymbol);
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
