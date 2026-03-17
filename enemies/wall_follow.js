// Left-hand rule wall follower.
// Always tries to turn left relative to current facing; falls back to
// straight → right → reverse. In open space this produces tight clockwise
// circles (because "left" is always blocked, driving a loop).
// entity.facing: 0=N 1=E 2=S 3=W

const DIR_VECTORS = [
  { x:  0, y: -1 }, // 0 N
  { x:  1, y:  0 }, // 1 E
  { x:  0, y:  1 }, // 2 S
  { x: -1, y:  0 }, // 3 W
];

export const config = {
  templateSymbol: '3',
  renderSymbol:   '▲',
  color:          'cyan',
  movement:       'wall_follow',
  onPlayerCollide: 'kill',
  onEnemyCollide:  'bounce',
  initialFacing:   0, // start facing North
};

export function move(entity, { maze, entities }) {
  const facing = entity.facing ?? 0;
  // Priority: left of current facing, straight, right, back
  const tryOrder = [
    (facing + 3) % 4, // left
    facing,           // straight
    (facing + 1) % 4, // right
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
