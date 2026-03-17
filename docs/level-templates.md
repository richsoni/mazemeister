# Level Template Guide

This guide explains how to create custom levels for the Dot Game.

## File Format

Level files are stored in the `levels/` directory and must be named sequentially:
- `level1.txt`
- `level2.txt` 
- `level3.txt`
- etc.

## Template Characters

Each character in the level file represents a different element:

| Character | Element | Description |
|-----------|---------|-------------|
| `O` | Player Start | Where the player spawns (only one per level) |
| `E` | Exit | Level completion point (only one per level) |
| `#` | Wall | Impassable barriers |
| ` ` (space) | Path | Open areas the player can move through |
| `1` | Bad Guy | NPC enemies that end the game on contact |

## Design Guidelines

### Required Elements
- **Exactly one `O`** - Player start position
- **Exactly one `E`** - Exit position
- **Border walls** - Surround the level with `#` characters
- **Clear path** - Ensure there's a route from start to exit

### Optional Elements
- **Bad guys (`1`)** - Add challenge and difficulty
- **Maze walls** - Create interesting paths and puzzles

### Best Practices

1. **Test your levels** - Play through them to ensure they're solvable
2. **Progressive difficulty** - Make later levels more challenging
3. **Balanced enemy placement** - Don't make levels impossible
4. **Visual clarity** - Ensure paths are clear and logical

## Example Level

```
#####################
#O                  #
### ############### #
#   #             # #
# # # ########### # #
# # #           # # #
# # ########### # # #
# #           # # # #
# ########### # # # #
#           # # # # #
########### # # # # #
#           # #   # #
# ########### # # # #
# #           # # # #
# # ########### # # #
# #           # # # #
# ########### # # # #
# #           # #   #
# # ############### #
# #       1        E#
#####################
```

## Level Dimensions

- **Minimum size**: 5x5 characters
- **Maximum size**: No hard limit (viewport will scroll)
- **Recommended**: 15-30 characters wide, 10-25 characters tall

## Testing Your Levels

1. Save your level file in the `levels/` directory
2. Run the game with your level number:
   ```bash
   node maze-game.js [level_number]
   ```
3. Test for:
   - Solvable path from start to exit
   - Appropriate difficulty
   - Visual clarity
   - Fun factor

## Common Mistakes

- **No path to exit** - Make sure there's always a route
- **Multiple player starts** - Only use one `O` per level
- **Missing borders** - Always surround with walls
- **Impossible difficulty** - Balance challenge with fairness
- **Empty levels** - Add interesting elements and obstacles

## Level Ideas

- **Simple maze** - Basic pathfinding challenges
- **Enemy gauntlets** - Dodge multiple bad guys
- **Narrow passages** - Precision movement required
- **Multi-path puzzles** - Multiple routes with different challenges
- **Speed runs** - Open areas with strategic enemy placement