import { Enemy } from './Enemy.js';

export class StaticEnemy extends Enemy {
  static templateSymbol = '1';
  static renderSymbol   = '■';
  static color          = 'red';
  static movement       = 'static';
  // move and getSymbol inherited from Enemy (no-op move, renderSymbol)
}
