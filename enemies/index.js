// To add a new enemy: create enemies/<Name>.js extending Enemy, then add it here.

import { Hole }        from './static.js';
import { BrownWalker } from './random_walk.js';
import { Lex }         from './wall_follow.js';
import { BounceRay }   from './glider.js';
import { PingHoriz }   from './ping_horiz.js';
import { PingVert }    from './ping_vert.js';
import { Mag }         from './chaser.js';
import { BrownRay }    from './tumbler.js';
import { Dev }         from './right_follow.js';

export { resolveEnemyCollisions } from './interactions.js';

const ENEMIES = [
  Hole,
  BrownWalker,
  Lex,
  BounceRay,
  PingHoriz,
  PingVert,
  Mag,
  BrownRay,
  Dev,
];

export const ENTITY_CONFIG      = Object.fromEntries(ENEMIES.map(E => [E.movement, E.config]));
export const MOVEMENT_BEHAVIORS = Object.fromEntries(ENEMIES.map(E => [E.movement, E.move]));
export const SYMBOL_FNS         = Object.fromEntries(ENEMIES.map(E => [E.movement, E.getSymbol]));
