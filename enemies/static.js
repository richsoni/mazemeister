export const config = {
  templateSymbol: '1',
  renderSymbol:   '■',
  color:          'red',
  movement:       'static',
  onPlayerCollide: 'kill',
  onEnemyCollide:  'ignore',
};

export function getSymbol(entity) { return entity.renderSymbol; }

export function move(entity) {
  return entity;
}
