export class Enemy {
  static templateSymbol  = null;
  static renderSymbol    = null;
  static color           = null;
  static movement        = null;
  static onPlayerCollide = 'kill';
  static onEnemyCollide  = 'ignore';
  static initialFacing   = undefined;
  static tickInterval    = undefined;

  static getSymbol(entity) {
    return entity.renderSymbol;
  }

  static move(entity, _ctx) {
    return entity;
  }

  // Derives the config object the rest of the engine expects.
  // Uses `this` so subclass static fields are read correctly.
  static get config() {
    return {
      templateSymbol:  this.templateSymbol,
      renderSymbol:    this.renderSymbol,
      color:           this.color,
      movement:        this.movement,
      onPlayerCollide: this.onPlayerCollide,
      onEnemyCollide:  this.onEnemyCollide,
      ...(this.initialFacing !== undefined && { initialFacing: this.initialFacing }),
      ...(this.tickInterval  !== undefined && { tickInterval:  this.tickInterval }),
    };
  }
}
