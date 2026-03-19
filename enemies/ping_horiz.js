// Moves horizontally; reverses direction when hitting a wall or enemy.
// Waits in place only if both left and right are blocked.
// entity.facing: 1=E 3=W

import { Enemy } from './Enemy.js';

const FACING_SYMBOLS = ['∧', '›', '∨', '‹'];

const DIR_VECTORS = [
  { x:  0, y: -1 }, // 0 N
  { x:  1, y:  0 }, // 1 E
  { x:  0, y:  1 }, // 2 S
  { x: -1, y:  0 }, // 3 W
];

export class PingHoriz extends Enemy {
  static templateSymbol = '<';
  static renderSymbol   = '›';
  static color          = 'cyan';
  static movement       = 'ping_horiz';
  static initialFacing  = 1;

  static getSymbol(entity) {
    return FACING_SYMBOLS[entity.facing ?? 1];
  }

  static move(entity, { maze, entities }) {
    const facing = entity.facing ?? 1;
    const reverse = (facing + 2) % 4;

    const canMove = (dir) => {
      const { x: dx, y: dy } = DIR_VECTORS[dir];
      const nx = entity.x + dx, ny = entity.y + dy;
      return maze[ny]?.[nx] === ' ' &&
        !entities.some(other => other !== entity && other.x === nx && other.y === ny);
    };

    if (canMove(facing)) {
      const { x: dx, y: dy } = DIR_VECTORS[facing];
      return { ...entity, x: entity.x + dx, y: entity.y + dy };
    }
    if (canMove(reverse)) {
      const { x: dx, y: dy } = DIR_VECTORS[reverse];
      return { ...entity, x: entity.x + dx, y: entity.y + dy, facing: reverse };
    }
    return entity;
  }
}
