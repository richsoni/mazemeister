// Like the glider but turns in a random direction when blocked instead of
// always trying right → left → back.
// entity.facing: 0=N 1=E 2=S 3=W

const FACING_SYMBOLS = ['↑', '→', '↓', '←'];

const DIR_VECTORS = [
  { x:  0, y: -1 }, // 0 N
  { x:  1, y:  0 }, // 1 E
  { x:  0, y:  1 }, // 2 S
  { x: -1, y:  0 }, // 3 W
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const config = {
  templateSymbol:  '7',
  renderSymbol:    '↑',
  color:           'white',
  movement:        'tumbler',
  onPlayerCollide: 'kill',
  onEnemyCollide:  'ignore',
  initialFacing:   0,
};

export function getSymbol(entity) {
  return FACING_SYMBOLS[entity.facing ?? 0];
}

export function move(entity, { maze, entities }) {
  const facing = entity.facing ?? 0;

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

  const fallbacks = shuffle([(facing + 1) % 4, (facing + 3) % 4, (facing + 2) % 4]);
  for (const dir of fallbacks) {
    if (canMove(dir)) {
      const { x: dx, y: dy } = DIR_VECTORS[dir];
      return { ...entity, x: entity.x + dx, y: entity.y + dy, facing: dir };
    }
  }
  return entity;
}
