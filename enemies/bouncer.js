// Moves in a straight line; reverses direction when hitting a wall or enemy.
// Waits in place only if both forward and backward are blocked.
// entity.facing: 0=N 1=E 2=S 3=W

const FACING_SYMBOLS = ['↑', '→', '↓', '←'];

const DIR_VECTORS = [
  { x:  0, y: -1 }, // 0 N
  { x:  1, y:  0 }, // 1 E
  { x:  0, y:  1 }, // 2 S
  { x: -1, y:  0 }, // 3 W
];

export const config = {
  templateSymbol:  '5',
  renderSymbol:    '↑',
  color:           'green',
  movement:        'bouncer',
  onPlayerCollide: 'kill',
  onEnemyCollide:  'ignore',
  initialFacing:   0,
};

export function getSymbol(entity) {
  return FACING_SYMBOLS[entity.facing ?? 0];
}

export function move(entity, { maze, entities }) {
  const facing = entity.facing ?? 0;
  const reverse = (facing + 2) % 4;

  const canMove = (dir) => {
    const { x: dx, y: dy } = DIR_VECTORS[dir];
    const nx = entity.x + dx, ny = entity.y + dy;
    return maze[ny]?.[nx] === ' ' &&
      !entities.some(other => other !== entity && other.x === nx && other.y === ny);
  };

  if (canMove(facing))  {
    const { x: dx, y: dy } = DIR_VECTORS[facing];
    return { ...entity, x: entity.x + dx, y: entity.y + dy };
  }
  if (canMove(reverse)) {
    const { x: dx, y: dy } = DIR_VECTORS[reverse];
    return { ...entity, x: entity.x + dx, y: entity.y + dy, facing: reverse };
  }
  return entity; // both directions blocked — wait
}
