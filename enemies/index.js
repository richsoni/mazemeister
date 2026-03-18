// Add a new enemy: create enemies/<name>.js exporting `config` and `move`,
// then add two lines here — one import and one entry in each map below.

import * as staticEnemy  from './static.js';
import * as randomWalk   from './random_walk.js';
import * as wallFollow   from './wall_follow.js';
import * as glider       from './glider.js';
import * as bouncer      from './bouncer.js';
import * as chaser       from './chaser.js';
import * as tumbler      from './tumbler.js';
import * as rightFollow  from './right_follow.js';

export { resolveEnemyCollisions } from './interactions.js';

// Maps templateSymbol → full config (used by parseLevel)
export const ENTITY_CONFIG = {
  staticEnemy:  staticEnemy.config,
  movingEnemy:  randomWalk.config,
  wallFollower: wallFollow.config,
  glider:       glider.config,
  bouncer:      bouncer.config,
  chaser:       chaser.config,
  tumbler:      tumbler.config,
  rightFollow:  rightFollow.config,
};

// Maps movement key → move function (used by the game loop)
export const MOVEMENT_BEHAVIORS = {
  [staticEnemy.config.movement]:  staticEnemy.move,
  [randomWalk.config.movement]:   randomWalk.move,
  [wallFollow.config.movement]:   wallFollow.move,
  [glider.config.movement]:       glider.move,
  [bouncer.config.movement]:      bouncer.move,
  [chaser.config.movement]:       chaser.move,
  [tumbler.config.movement]:      tumbler.move,
  [rightFollow.config.movement]:  rightFollow.move,
};

// Maps movement key → symbol function (used by the renderer)
export const SYMBOL_FNS = {
  [staticEnemy.config.movement]:  staticEnemy.getSymbol,
  [randomWalk.config.movement]:   randomWalk.getSymbol,
  [wallFollow.config.movement]:   wallFollow.getSymbol,
  [glider.config.movement]:       glider.getSymbol,
  [bouncer.config.movement]:      bouncer.getSymbol,
  [chaser.config.movement]:       chaser.getSymbol,
  [tumbler.config.movement]:      tumbler.getSymbol,
  [rightFollow.config.movement]:  rightFollow.getSymbol,
};
