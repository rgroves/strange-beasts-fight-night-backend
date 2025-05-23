import { WithStartWorkflowOperation, type Client } from '@temporalio/client';
import { addPlayerUpdate, saveMonsterConfig, startMonsterImageGen, TASK_QUEUE_NAME } from '../shared';
import { runGame } from '../workflows';
import { GameId, MonsterConfig, PlayerId } from '../types';
import debug from 'debug';
import { GameNotFoundError } from './game-errors';

const dbglogger = debug('giant-monster-brawl:game-controller');

interface StartGameInput {
  playerId: PlayerId;
}

interface StartGameOutput {
  gameId: GameId;
  playerId: PlayerId;
}

interface AddPlayerInput {
  gameId: GameId;
  requestedPlayerId: PlayerId;
}

interface AddPlayerOuptut {
  playerId: PlayerId;
}

interface UploadDoodleInput {
  gameId: GameId;
  playerId: PlayerId;
  monsterDescription: string;
  doodleFileName: string;
}

interface UploadMonsterConfigInput {
  gameId: GameId;
  playerId: PlayerId;
  monsterConfig: MonsterConfig;
}

export default class GameController {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public startGame = async ({ playerId: requestedPlayerId }: StartGameInput): Promise<StartGameOutput> => {
    const workflowId = generateGameId();
    const startWorkflowOperation = new WithStartWorkflowOperation(runGame, {
      workflowId,
      args: [],
      taskQueue: TASK_QUEUE_NAME,
      workflowIdConflictPolicy: 'FAIL',
    });

    const { playerId } = await this.client.workflow.executeUpdateWithStart(addPlayerUpdate, {
      startWorkflowOperation,
      args: [{ requestedPlayerId }],
    });

    dbglogger(`A runGame workflow execution was queued: WorkflowId(${workflowId}) PlayerId(${playerId})`);

    return { gameId: workflowId, playerId };
  };

  public getGameState = async (gameId: GameId) => {
    const handle = this.client.workflow.getHandle(gameId);
    const result = await handle.query('getGameState', { gameId });

    if (!result) {
      dbglogger(`No game found with ID ${gameId}`);
      throw new GameNotFoundError(gameId);
    }

    dbglogger(`Game state for ${gameId}: ${JSON.stringify(result)}`);
    return result;
  };

  public addPlayer = async ({ gameId, requestedPlayerId }: AddPlayerInput): Promise<AddPlayerOuptut> => {
    dbglogger(`Received request to join game ${gameId} with player ID ${requestedPlayerId}`);
    const handle = this.client.workflow.getHandle(gameId);
    const { playerId } = await handle.executeUpdate(addPlayerUpdate, {
      args: [{ requestedPlayerId }],
    });

    dbglogger(`Added player ID: ${playerId}`);
    return { playerId };
  };

  public uploadDoodle = async ({
    gameId,
    playerId,
    monsterDescription,
    doodleFileName,
  }: UploadDoodleInput): Promise<void> => {
    const prompt = `Inspired by my doodle, generate: ${monsterDescription}`;
    const style = 'retro sci-fi pulp magazine illustration';

    dbglogger(`Sending request to generate monster image for game ${gameId} for player ${playerId}`);

    const handle = this.client.workflow.getHandle(gameId);
    await handle?.signal(startMonsterImageGen, {
      playerId,
      doodleFileName,
      prompt,
      style,
    });

    dbglogger(`Monster image generation request was sent for game ${gameId} for player ${playerId}`);
  };

  public async uploadMonsterConfig({ gameId, playerId, monsterConfig }: UploadMonsterConfigInput): Promise<void> {
    dbglogger(`Received request to save monster config for game ${gameId} for player ${playerId}`);
    dbglogger(`Monster config: ${JSON.stringify(monsterConfig)}`);

    const handle = this.client?.workflow.getHandle(gameId);
    await handle?.signal(saveMonsterConfig, {
      playerId,
      config: monsterConfig,
    });
  }
}

function generateGameId() {
  const wordSets = {
    wordSet1: [
      'claw',
      'fang',
      'spike',
      'tusk',
      'horn',
      'scale',
      'wing',
      'tail',
      'crest',
      'mantle',
      'shell',
      'carapace',
      'pelt',
      'plume',
      'mane',
      'hide',
      'talon',
      'hoof',
      'beak',
      'feeler',
    ],
    wordSet2: [
      'slash',
      'bite',
      'pounce',
      'stomp',
      'crush',
      'swipe',
      'pierce',
      'ram',
      'trample',
      'engulf',
      'thrash',
      'impale',
      'devour',
      'gore',
      'maul',
      'rend',
      'seize',
      'batter',
      'lunge',
      'constrict',
    ],
    wordSet3: [
      'blaze',
      'frost',
      'thunder',
      'venom',
      'shadow',
      'spectral',
      'arcane',
      'phantom',
      'electric',
      'volcanic',
      'chilling',
      'inferno',
      'gale',
      'quake',
      'surge',
      'ripple',
      'spark',
      'toxin',
      'ooze',
      'scream',
    ],
  };
  const randomWords = [];

  for (const wordSet of Object.values(wordSets)) {
    const randomIndex = Math.floor(Math.random() * wordSet.length);
    const randomWord = wordSet[randomIndex];
    randomWords.push(randomWord);
  }

  return randomWords.join('-');
}
