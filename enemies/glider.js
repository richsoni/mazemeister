// Moves in a straight line until blocked, then tries right → left → back.
// Stays put only if all four directions are blocked.
// entity.facing: 0=N 1=E 2=S 3=W

import { Enemy } from './Enemy.js';

const FACING_SYMBOLS = ['▲', '▶', '▼', '◀'];

const DIR_VECTORS = [
  { x:  0, y: -1 }, // 0 N
  { x:  1, y:  0 }, // 1 E
  { x:  0, y:  1 }, // 2 S
  { x: -1, y:  0 }, // 3 W
];

export class BounceRay extends Enemy {
  static templateSymbol = 'B';
  static renderSymbol   = '▲';
  static color          = 'magentaBright';
  static movement       = 'bounce_ray';
  static initialFacing  = 0;

  static getSymbol(entity) {
    return FACING_SYMBOLS[entity.facing ?? 0];
  }

  static move(entity, { maze, entities }) {
    const facing = entity.facing ?? 0;
    const tryOrder = [
      facing,           // straight
      (facing + 1) % 4, // right
      (facing + 3) % 4, // left
      (facing + 2) % 4, // back
    ];
    for (const dir of tryOrder) {
      const { x: dx, y: dy } = DIR_VECTORS[dir];
      const nx = entity.x + dx, ny = entity.y + dy;
      if (maze[ny]?.[nx] === ' ' &&
          !entities.some(other => other !== entity && other.x === nx && other.y === ny)) {
        return { ...entity, x: nx, y: ny, facing: dir };
      }
    }
    return entity;
  }
}
