import { Enemy } from './Enemy.js';
import { CARDINAL_DIRS } from '../utils.js';

export class RandomWalk extends Enemy {
  static templateSymbol = '2';
  static renderSymbol   = '♦';
  static color          = 'magenta';
  static movement       = 'random_walk';
  static tickInterval   = 2;

  static move(entity, { maze, entities }) {
    const valid = CARDINAL_DIRS.filter(({ x: dx, y: dy }) => {
      const nx = entity.x + dx, ny = entity.y + dy;
      return maze[ny]?.[nx] === ' ' &&
        !entities.some(other => other !== entity && other.x === nx && other.y === ny);
    });
    if (!valid.length) return entity;
    const dir = valid[Math.floor(Math.random() * valid.length)];
    return { ...entity, x: entity.x + dir.x, y: entity.y + dir.y };
  }
}
