// To add a new enemy: create enemies/<Name>.js extending Enemy, then add it here.

import { StaticEnemy }  from './static.js';
import { RandomWalk }   from './random_walk.js';
import { WallFollow }   from './wall_follow.js';
import { Glider }       from './glider.js';
import { Bouncer }      from './bouncer.js';
import { Chaser }       from './chaser.js';
import { Tumbler }      from './tumbler.js';
import { RightFollow }  from './right_follow.js';

export { resolveEnemyCollisions } from './interactions.js';

const ENEMIES = [
  StaticEnemy,
  RandomWalk,
  WallFollow,
  Glider,
  Bouncer,
  Chaser,
  Tumbler,
  RightFollow,
];

export const ENTITY_CONFIG      = Object.fromEntries(ENEMIES.map(E => [E.movement, E.config]));
export const MOVEMENT_BEHAVIORS = Object.fromEntries(ENEMIES.map(E => [E.movement, E.move]));
export const SYMBOL_FNS         = Object.fromEntries(ENEMIES.map(E => [E.movement, E.getSymbol]));
