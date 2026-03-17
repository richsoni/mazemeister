export const config = {
  templateSymbol: '1',
  renderSymbol:   '■',
  color:          'red',
  movement:       'static',
  onPlayerCollide: 'kill',
  onEnemyCollide:  'ignore',
};

export function move(entity) {
  return entity;
}
