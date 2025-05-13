import { condition, log, setHandler } from '@temporalio/workflow';

import { addPlayerUpdate, getGameStateQuery } from './shared';
import { AddPlayerInput, AddPlayerOuptut, GameState, GetGameStateInput, Player } from './types';

export async function runGame(): Promise<string> {
  const gameState: GameState = {
    state: 'LobbyPhase',
    players: [],
  };

  setHandler(addPlayerUpdate, (input: AddPlayerInput): AddPlayerOuptut => {
    const player: Player = { id: input.requestedPlayerId };
    if (gameState.players.some((p) => p.id === player.id)) {
      log.warn(`Player ${input.requestedPlayerId} is already in the game.`);
      throw new Error(`Player ${input.requestedPlayerId} is already in the game.`);
    }
    gameState.players.push(player);
    log.info(`Player ${input.requestedPlayerId} added to the game.`);
    return { playerId: input.requestedPlayerId };
  });

  setHandler(getGameStateQuery, (input: GetGameStateInput): GameState => {
    log.info(`Game state requested for game ID: ${input.gameId}`);
    return gameState;
  });

  await condition(() => gameState.players.length == 2);

  gameState.state = 'PlayerSetupPhase';
  log.info(`Game is now in PlayerSetupPhase with players: ${gameState.players.map((p) => p.id).join(', ')}`);

  gameState.state = 'GameOver';
  return `Game ended... but was it ever really started?`;
}
