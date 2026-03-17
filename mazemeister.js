#!/usr/bin/env node

const term = require("terminal-kit").terminal;
const process = require("process");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

class MazeGame {
  constructor(levelNumber = 1) {
    this.levelNumber = levelNumber;
    this.maze = [];
    this.playerX = 0;
    this.playerY = 0;
    this.exitX = 0;
    this.exitY = 0;
    this.width = 0;
    this.height = 0;
    this.won = false;
    this.gameOver = false;
    this.paused = false;
    this.entities = [];

    this.wallConfig = {
      symbol: "#",
      color: "gray",
    };

    this.entityConfig = {
      staticEnemy: {
        templateSymbol: "1",
        renderSymbol: "■",
        gameFunction: "kill",
        color: "red"
      },
      movingEnemy: {
        templateSymbol: "2",
        renderSymbol: "♦",
        gameFunction: "kill_move",
        color: "magenta"
      },
      exit: {
        templateSymbol: "E",
        renderSymbol: "⍟",
        gameFunction: "exit",
        color: "yellow"
      },
    };

    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.updateViewport();

    this.loadLevel(levelNumber);
    this.setupInput();
    this.startGameLoop();
  }

  loadLevel(levelNumber) {
    try {
      const levelPath = path.join(
        __dirname,
        "levels",
        `level${levelNumber}.txt`
      );
      const levelData = fs.readFileSync(levelPath, "utf8");
      const lines = levelData.trim().split("\n");

      this.height = lines.length;
      this.width = Math.max(...lines.map((line) => line.length));
      this.maze = [];
      this.entities = [];

      for (let y = 0; y < this.height; y++) {
        this.maze[y] = [];
        const line = lines[y] || "";
        for (let x = 0; x < this.width; x++) {
          const char = line[x] || " ";
          this.maze[y][x] = char;

          if (char === "O" || char === "0") {
            this.playerX = x;
            this.playerY = y;
            this.maze[y][x] = " ";
          } else {
            for (const [entityType, config] of Object.entries(
              this.entityConfig
            )) {
              if (char === config.templateSymbol) {
                this.entities.push({
                  x,
                  y,
                  type: entityType,
                  renderSymbol: config.renderSymbol,
                  gameFunction: config.gameFunction,
                  color: config.color
                });
                if (config.gameFunction === "exit") {
                  this.exitX = x;
                  this.exitY = y;
                }
                this.maze[y][x] = " ";
                break;
              }
            }
          }
        }
      }
    } catch (error) {
      term.red(`Could not load level ${levelNumber}: ${error.message}\n`);
      process.exit(1);
    }
  }

  nextLevel() {
    setTimeout(() => {
      this.levelNumber++;
      try {
        this.loadLevel(this.levelNumber);
        this.won = false;
        this.gameOver = false;
        this.paused = false;
        if (this.gameLoopInterval) {
          clearInterval(this.gameLoopInterval);
        }
        this.startGameLoop();
        this.render();
      } catch (error) {
        term.clear();
        term.moveTo(1, 1);
        term(`\nCongratulations! You completed all ${this.levelNumber - 1} levels!\n`);
        term("Press Ctrl+C to exit.\n");
      }
    }, 1000);
  }

  restartLevel() {
    this.loadLevel(this.levelNumber);
    this.won = false;
    this.gameOver = false;
    this.paused = false;
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    this.startGameLoop();
    this.render();
  }

  updateViewport() {
    this.viewportWidth = term.width || 80;
    this.viewportHeight = (term.height || 24) - 2;
  }

  setupInput() {
    term.grabInput({ mouse: false });

    term.on("resize", () => {
      this.updateViewport();
      this.render();
    });

    term.on("key", (name) => {
      if (name === "CTRL_C") {
        process.exit();
      }

      if (this.won) return;

      if (name === "p") {
        this.paused = !this.paused;
        this.render();
        return;
      }

      if (this.gameOver) {
        if (name === "r") { this.restartLevel(); return; }
        if (name === "q") { process.exit(); }
        return;
      }

      if (this.paused) return;

      let newX = this.playerX;
      let newY = this.playerY;

      switch (name) {
        case "UP":
        case "w":
          newY--;
          break;
        case "DOWN":
        case "s":
          newY++;
          break;
        case "LEFT":
        case "a":
          newX--;
          break;
        case "RIGHT":
        case "d":
          newX++;
          break;
        case "q":
          process.exit();
          break;
      }

      if (this.maze[newY] && this.maze[newY][newX] === " ") {
        const hitEntity = this.entities.find(
          (entity) => entity.x === newX && entity.y === newY
        );
        if (
          hitEntity &&
          (hitEntity.gameFunction === "kill" ||
            hitEntity.gameFunction === "kill_move")
        ) {
          this.gameOver = true;
          this.render();
          return;
        }

        this.playerX = newX;
        this.playerY = newY;

        if (newX === this.exitX && newY === this.exitY) {
          this.won = true;
          this.nextLevel();
        }

        this.render();
      }
    });
  }

  moveEnemies() {
    for (const entity of this.entities) {
      if (entity.gameFunction === "kill_move") {
        const directions = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 }
        ];

        const validMoves = directions.filter(dir => {
          const newX = entity.x + dir.x;
          const newY = entity.y + dir.y;
          return this.maze[newY] &&
                 this.maze[newY][newX] === " " &&
                 !this.entities.some(other => other !== entity && other.x === newX && other.y === newY);
        });

        if (validMoves.length > 0) {
          const move = validMoves[Math.floor(Math.random() * validMoves.length)];
          entity.x += move.x;
          entity.y += move.y;

          if (entity.x === this.playerX && entity.y === this.playerY) {
            this.gameOver = true;
          }
        }
      }
    }
  }

  startGameLoop() {
    this.gameLoopInterval = setInterval(() => {
      if (!this.gameOver && !this.won && !this.paused) {
        this.moveEnemies();
        this.render();
      }
    }, 500);
  }

  render() {
    const borderWidth = 2;
    const gameWidth = this.viewportWidth - borderWidth * 2;
    const gameHeight = this.viewportHeight - borderWidth * 2;

    const cameraX = Math.max(
      0,
      Math.min(this.width - gameWidth, this.playerX - Math.floor(gameWidth / 2))
    );
    const cameraY = Math.max(
      0,
      Math.min(this.height - gameHeight, this.playerY - Math.floor(gameHeight / 2))
    );

    const endY = Math.min(this.height, cameraY + gameHeight);
    const endX = Math.min(this.width, cameraX + gameWidth);

    // Top border
    term.moveTo(1, 1);
    term.bgGreen(" ".repeat(this.viewportWidth));

    for (let y = cameraY; y < endY; y++) {
      const screenRow = (y - cameraY) + 2;
      term.moveTo(1, screenRow);

      // Left border
      term.bgGreen("  ");

      for (let x = cameraX; x < endX; x++) {
        const entity = this.entities.find(
          (entity) => entity.x === x && entity.y === y
        );

        if (x === this.playerX && y === this.playerY) {
          term.styleReset();
          term(this.gameOver ? "X" : "●");
        } else if (entity) {
          term.styleReset();
          term(chalk[entity.color] ? chalk[entity.color](entity.renderSymbol) : entity.renderSymbol);
        } else if (this.maze[y][x] === this.wallConfig.symbol) {
          term.bgGray(" ");
        } else {
          term.styleReset();
          term(this.maze[y][x]);
        }
      }

      // Right border
      term.bgGreen("  ");
    }

    // Bottom border
    const bottomRow = (endY - cameraY) + 2;
    term.moveTo(1, bottomRow);
    term.bgGreen(" ".repeat(this.viewportWidth));

    // Status line
    term.moveTo(1, bottomRow + 1);
    term.styleReset();
    term.eraseLine();

    if (this.gameOver) {
      term("Game Over! You hit a bad guy. Press R to restart level, Q to quit.");
    } else if (this.won) {
      term(`Level ${this.levelNumber} complete! Loading next level...`);
    } else if (this.paused) {
      term(`Level ${this.levelNumber} - PAUSED. Press P to unpause, Q to quit.`);
    } else {
      term(`Level ${this.levelNumber} - Use WASD or arrow keys to move. P to pause. Q to quit.`);
    }
  }

  start() {
    term.clear();
    term.hideCursor();
    this.render();
  }
}

process.on("exit", () => {
  term.grabInput(false);
  term.showCursor();
  term.styleReset();
});

const levelArg = process.argv.slice(2).find(arg => arg.startsWith("--level="));
const levelNumber = levelArg ? parseInt(levelArg.split("=")[1]) : (process.argv[2] ? parseInt(process.argv[2]) : 1);
const game = new MazeGame(levelNumber);
game.start();
