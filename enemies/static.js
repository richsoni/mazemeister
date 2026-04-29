import { Enemy } from './Enemy.js';

export class Hole extends Enemy {
  static templateSymbol = 'H';
  static renderSymbol   = '█';
  static color          = 'red';
  static movement       = 'hole';
  // move and getSymbol inherited from Enemy (no-op move, renderSymbol)
}
