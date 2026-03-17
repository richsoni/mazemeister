// Enemy–enemy interaction handlers.
// Called when two enemies land on the same cell after moving.
// Receives (newA, prevA, newB, prevB) — prev* are positions before this tick.
// Returns { a, b } with resolved entity states.
// Resolution rule: if either entity specifies a non-'ignore' handler, that wins.

const HANDLERS = {
  ignore: (newA, _prevA, newB, _prevB) => ({ a: newA, b: newB }),

  // Both enemies bounce back to where they were and reverse facing (if applicable).
  bounce: (_newA, prevA, _newB, prevB) => ({
    a: { ...prevA, ...(prevA.facing !== undefined && { facing: (prevA.facing + 2) % 4 }) },
    b: { ...prevB, ...(prevB.facing !== undefined && { facing: (prevB.facing + 2) % 4 }) },
  }),
};

export function resolveEnemyCollisions(newEntities, prevEntities) {
  const result = [...newEntities];
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (result[i].x !== result[j].x || result[i].y !== result[j].y) continue;
      const key = (result[i].onEnemyCollide !== 'ignore' ? result[i].onEnemyCollide : result[j].onEnemyCollide) ?? 'ignore';
      const handler = HANDLERS[key] ?? HANDLERS.ignore;
      const { a, b } = handler(result[i], prevEntities[i], result[j], prevEntities[j]);
      result[i] = a;
      result[j] = b;
    }
  }
  return result;
}
