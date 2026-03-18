export const CARDINAL_DIRS = [
  { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
];

export function getEntityAt(entities, x, y) {
  return entities.find(en => en.x === x && en.y === y);
}

export function isEnemy(entity) {
  return entity.onPlayerCollide === 'kill';
}

// Builds an entity object from config + position, including any behavior-specific
// initial state (e.g. facing direction for wall_follow).
export function createEntity(config, x, y) {
  return {
    x, y,
    renderSymbol:    config.renderSymbol,
    color:           config.color,
    movement:        config.movement,
    onPlayerCollide: config.onPlayerCollide,
    onEnemyCollide:  config.onEnemyCollide ?? 'ignore',
    ...(config.initialFacing  !== undefined && { facing:        config.initialFacing }),
    ...(config.tickInterval   !== undefined && { tickInterval:  config.tickInterval }),
  };
}
