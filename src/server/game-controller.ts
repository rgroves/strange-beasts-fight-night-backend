import { WithStartWorkflowOperation, type Client } from '@temporalio/client';
import { addPlayerUpdate, TASK_QUEUE_NAME } from '../shared';
import { runGame } from '../workflows';
import { GameId, PlayerId } from '../types';
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
