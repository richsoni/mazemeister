// Add a new enemy: create enemies/<name>.js exporting `config` and `move`,
// then add two lines here — one import and one entry in each map below.

import * as staticEnemy  from './static.js';
import * as randomWalk   from './random_walk.js';
import * as wallFollow   from './wall_follow.js';

export { resolveEnemyCollisions } from './interactions.js';

// Maps templateSymbol → full config (used by parseLevel)
export const ENTITY_CONFIG = {
  staticEnemy:  staticEnemy.config,
  movingEnemy:  randomWalk.config,
  wallFollower: wallFollow.config,
};

// Maps movement key → move function (used by the game loop)
export const MOVEMENT_BEHAVIORS = {
  [staticEnemy.config.movement]:  staticEnemy.move,
  [randomWalk.config.movement]:   randomWalk.move,
  [wallFollow.config.movement]:   wallFollow.move,
};
