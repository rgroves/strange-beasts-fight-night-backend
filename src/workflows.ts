import { condition, log, proxyActivities, setHandler } from '@temporalio/workflow';

import type * as activities from './activities';
import { addPlayerUpdate, getGameStateQuery, startMonsterImageGen } from './shared';
import {
  AddPlayerInput,
  AddPlayerOuptut,
  GameState,
  GetGameStateInput,
  Player,
  StartMonsterImageGenInput,
} from './types';

const { generateMonsterImage } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
    initialInterval: '60 seconds',
    backoffCoefficient: 2,
    maximumInterval: '5 minutes',
  },
});

export async function runGame(): Promise<string> {
  const gameState: GameState = {
    state: 'LobbyPhase',
    maxPlayers: 2,
    players: [],
    monsterImageMap: {},
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

  setHandler(startMonsterImageGen, async (input: StartMonsterImageGenInput): Promise<void> => {
    const { playerId, doodleFilePath, prompt, style } = input;

    if (gameState.state !== 'DrawingPhase') {
      log.warn(`Game is not in DrawingPhase; cannot generate monster image.`);
      return;
    }

    if (gameState.monsterImageMap[playerId]) {
      log.warn(`Player ${playerId} already has a monster image; bypassing image generation.`);
      return;
    }

    const generatedImage = await generateMonsterImage({
      doodleFilePath,
      prompt,
      style,
    });

    gameState.monsterImageMap[playerId] = generatedImage.filePath;
    log.info(`Generated monster image for player ${playerId} at: ${generatedImage.filePath}`);

    if (Object.keys(gameState.monsterImageMap).length === gameState.maxPlayers) {
      gameState.state = 'MonsterConfigPhase';
      log.info(`All players have monster images; transitioning to MonsterConfigPhase.`);
    }
  });

  setHandler(getGameStateQuery, (input: GetGameStateInput): GameState => {
    log.info(`Game state requested for game ID: ${input.gameId}`);
    return gameState;
  });

  await condition(() => gameState.players.length === gameState.maxPlayers);

  gameState.state = 'DrawingPhase';
  log.info(`Game is now in DrawingPhase with players: ${gameState.players.map((p) => p.id).join(', ')}`);

  await condition(() => gameState.state === 'MonsterConfigPhase');
  log.info(`Game is now in MonsterConfigPhase. Players are configuring their monsters.`);

  gameState.state = 'GameOver';
  return `Game ended... but was it ever really started?`;
}
