// Chases the player by moving only in directions that are directly toward them.
// If the player is diagonal, tries the dominant axis first (larger distance).
// Does not move if no direct path toward the player is open.

import { Enemy } from './Enemy.js';

const DIR_VECTORS = [
  { x:  0, y: -1 }, // 0 N
  { x:  1, y:  0 }, // 1 E
  { x:  0, y:  1 }, // 2 S
  { x: -1, y:  0 }, // 3 W
];

export class Mag extends Enemy {
  static templateSymbol = 'M';
  static renderSymbol   = '⊕';
  static color          = 'red';
  static movement       = 'mag';

  static move(entity, { maze, entities, playerX, playerY }) {
    const dx = playerX - entity.x;
    const dy = playerY - entity.y;

    const candidates = [];
    if (dx !== 0) candidates.push({ dir: dx > 0 ? 1 : 3, axis: 'x' });
    if (dy !== 0) candidates.push({ dir: dy > 0 ? 2 : 0, axis: 'y' });

    const lastAxis = entity.lastAxis;
    if (candidates.length === 2 && lastAxis) {
      candidates.sort((a, b) => (a.axis === lastAxis ? 1 : -1));
    }

    for (const { dir, axis } of candidates) {
      const { x: ddx, y: ddy } = DIR_VECTORS[dir];
      const nx = entity.x + ddx, ny = entity.y + ddy;
      if (maze[ny]?.[nx] === ' ' &&
          !entities.some(other => other !== entity && other.x === nx && other.y === ny)) {
        return { ...entity, x: nx, y: ny, lastAxis: axis };
      }
    }
    return entity;
  }
}
