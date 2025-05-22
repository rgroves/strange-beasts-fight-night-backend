export class GameNotFoundError extends Error {
  constructor(gameId: string) {
    super(`Error: gameId ${gameId} found`);
    this.name = 'GameNotFoundError';
  }
}
