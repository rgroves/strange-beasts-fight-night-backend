import { condition, log, proxyActivities, setHandler, workflowInfo } from '@temporalio/workflow';

import type * as activities from './activities';
import { addPlayerUpdate, getGameStateQuery, saveMonsterConfig, startMonsterImageGen } from './shared';
import {
  AddPlayerInput,
  AddPlayerOuptut,
  GameState,
  GetGameStateInput,
  Player,
  SaveMonsterConfigInput,
  StartMonsterImageGenInput,
} from './types';

const { generateBattleAudio, generateBattleCommentary, generateMockBattleData, generateMonsterImage } = proxyActivities<
  typeof activities
>({
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
    playersMap: {},
    monsterImageMap: {},
    monsterConfigMap: {},
    battleAudioFileName: '',
  };

  setHandler(addPlayerUpdate, (input: AddPlayerInput): AddPlayerOuptut => {
    const player: Player = { id: input.requestedPlayerId };

    // TODO - Do something different here - like unique-ify the player ID
    if (gameState.playersMap[player.id]) {
      log.warn(`Player ${input.requestedPlayerId} is already in the game.`);
      throw new Error(`Player ${input.requestedPlayerId} is already in the game.`);
    }

    gameState.playersMap[player.id] = player;
    log.info(`Player ${input.requestedPlayerId} added to the game.`);

    return { playerId: input.requestedPlayerId };
  });

  setHandler(startMonsterImageGen, async (input: StartMonsterImageGenInput): Promise<void> => {
    const { playerId, doodleFileName, monsterDescription, prompt, style } = input;

    if (gameState.state !== 'DrawingPhase') {
      log.warn(`Game is not in DrawingPhase; cannot generate monster image.`);
      return;
    }

    if (gameState.monsterImageMap[playerId]) {
      log.warn(`Player ${playerId} already has a monster image; bypassing image generation.`);
      return;
    }

    const { monsterImageFileName } = await generateMonsterImage({
      doodleFileName,
      prompt,
      style,
    });

    gameState.playersMap[playerId].monsterDescription = monsterDescription;
    gameState.monsterImageMap[playerId] = monsterImageFileName;
    log.info(`Generated monster image for player ${playerId}: ${monsterImageFileName}`);

    if (Object.keys(gameState.monsterImageMap).length === gameState.maxPlayers) {
      setHandler(startMonsterImageGen, undefined);
      gameState.state = 'MonsterConfigPhase';
      log.info(`All players have monster images; transitioning to MonsterConfigPhase.`);
    }
  });

  setHandler(saveMonsterConfig, async (input: SaveMonsterConfigInput): Promise<void> => {
    const { playerId, config } = input;

    if (gameState.state !== 'MonsterConfigPhase') {
      log.warn(`Game is not in MonsterConfigPhase; cannot save monster config.`);
      return;
    }
    if (gameState.monsterConfigMap[playerId]) {
      log.warn(`Player ${playerId} already has a monster config; bypassing save.`);
      return;
    }

    gameState.monsterConfigMap[playerId] = config;
    log.info(`Saved monster config for player ${playerId}: ${JSON.stringify(config)}`);

    if (Object.keys(gameState.monsterConfigMap).length === gameState.maxPlayers) {
      setHandler(saveMonsterConfig, undefined);
      gameState.state = 'BattleResolutionPhase';
      log.info(`All players have monster configs; transitioning to BattleResolutionPhase.`);
    }
  });

  setHandler(getGameStateQuery, (input: GetGameStateInput): GameState => {
    log.info(`Game state requested for game ID: ${input.gameId}`);
    return gameState;
  });

  await condition(() => Object.keys(gameState.playersMap).length === gameState.maxPlayers);
  log.info(`All players have joined the game. Starting the game...`);
  setHandler(addPlayerUpdate, undefined);

  gameState.state = 'DrawingPhase';
  log.info(
    `Game is now in DrawingPhase with players: ${Object.values(gameState.playersMap)
      .map((p) => p.id)
      .join(', ')}`,
  );

  await condition(() => gameState.state === 'MonsterConfigPhase');
  log.info(`Game is now in MonsterConfigPhase. Players are configuring their monsters.`);
  // Each players' client should send a saveMonsterConfig signal.
  // When a monster config has been received by all players, the game will
  // transition to BattleResolutionPhase.

  await condition(() => gameState.state === 'BattleResolutionPhase');
  log.info('Game is now in BattleResolutionPhase.');
  // TODO: For MVP, just generate a mock battle; future versions should allow more
  // player control and strategy.
  const gameId = workflowInfo().workflowId;
  log.info(`Generating Battle Data for gameId: ${gameId}`);

  const { filePath: fightDetailsFilePath } = await generateMockBattleData({
    gameId,
    monsterConfigMap: gameState.monsterConfigMap,
  });

  log.info(`Fight details file: ${JSON.stringify(fightDetailsFilePath)}`);

  gameState.state = 'BattleCommentaryPhase';
  log.info(`Game is now in BattleCommentaryPhase. Generating battle commentary...`);

  const { battleCommentaryfilePath } = await generateBattleCommentary({
    gameId,
    fightDetailsFilePath,
  });

  log.info(`Battle commentary file: ${JSON.stringify(battleCommentaryfilePath)}`);

  gameState.state = 'AudioGenerationPhase';
  log.info(`Game is now in AudioGenerationPhase. Generating battle audio...`);

  const { battleAudioFileName } = await generateBattleAudio({
    gameId,
    battleCommentaryfilePath,
  });

  gameState.battleAudioFileName = battleAudioFileName;
  log.info(`Battle audio file: ${JSON.stringify(battleAudioFileName)}`);

  gameState.state = 'GameOver';

  return `Game Over`;
}
