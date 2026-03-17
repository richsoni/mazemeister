# Mazemeister

A terminal-based maze game where you navigate through maze levels while avoiding enemies.

## Play instantly (no install required)

```bash
npx mazemeister
```

That's it. Node.js is the only prerequisite.

## Install globally

```bash
npm install -g mazemeister
mazemeister
```

## Clone and run locally

```bash
git clone https://github.com/richsoni/mazemeister.git
cd mazemeister
npm install
npm start
```

## How to Play

- **Move**: WASD or arrow keys
- **Objective**: Reach the exit (⍟) while avoiding enemies
- **Static enemies** (■) — touching one ends the game
- **Moving enemies** (♦) — they roam the maze
- **Pause**: P
- **Restart level**: R (after game over)
- **Quit**: Q or Ctrl+C

## Starting on a specific level

```bash
npx mazemeister 3
# or
node mazemeister.js --level=3
```

## Controls

| Key | Action |
|-----|--------|
| W / ↑ | Move up |
| S / ↓ | Move down |
| A / ← | Move left |
| D / → | Move right |
| P | Pause / unpause |
| R | Restart level (after game over) |
| Q | Quit |
| Ctrl+C | Force quit |

## Levels

Levels are plain text files in the `levels/` directory (`level1.txt`, `level2.txt`, …).
See [docs/level-templates.md](docs/level-templates.md) for how to create your own.

## License

MIT © [Rich Soni](https://github.com/richsoni)
