// Right-hand rule wall follower — mirror of wall_follow.
// Always tries to turn right first; falls back to straight → left → reverse.
// In open space this produces tight clockwise circles.
// entity.facing: 0=N 1=E 2=S 3=W

const FACING_SYMBOLS = ['▲', '▶', '▼', '◀'];

const DIR_VECTORS = [
  { x:  0, y: -1 }, // 0 N
  { x:  1, y:  0 }, // 1 E
  { x:  0, y:  1 }, // 2 S
  { x: -1, y:  0 }, // 3 W
];

export const config = {
  templateSymbol:  '8',
  renderSymbol:    '▲',
  color:           'greenBright',
  movement:        'right_follow',
  onPlayerCollide: 'kill',
  onEnemyCollide:  'bounce',
  initialFacing:   0,
};

export function getSymbol(entity) {
  return FACING_SYMBOLS[entity.facing ?? 0];
}

export function move(entity, { maze, entities }) {
  const facing = entity.facing ?? 0;
  // Priority: right, straight, left, back
  const tryOrder = [
    (facing + 1) % 4, // right
    facing,           // straight
    (facing + 3) % 4, // left
    (facing + 2) % 4, // back
  ];
  for (const dir of tryOrder) {
    const { x: dx, y: dy } = DIR_VECTORS[dir];
    const nx = entity.x + dx, ny = entity.y + dy;
    if (maze[ny]?.[nx] === ' ' &&
        !entities.some(other => other !== entity && other.x === nx && other.y === ny)) {
      return { ...entity, x: nx, y: ny, facing: dir };
    }
  }
  return entity; // completely boxed in
}
