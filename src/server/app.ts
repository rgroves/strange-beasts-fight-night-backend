import { Connection, Client, WithStartWorkflowOperation } from '@temporalio/client';
import express, { Request, Response } from 'express';
import debug from 'debug';
import cors from 'cors';

import {
  addPlayerUpdate,
  getGameStateQuery,
  saveMonsterConfig,
  startMonsterImageGen,
  TASK_QUEUE_NAME,
} from '../shared';
import { runGame } from '../workflows';
import { GameId, MonsterConfig, PlayerId, Vitality } from '../types';

const dbglogger = debug('giant-monster-brawl:server');
const app = express();
const port = 3000;

let temporalClient: Client | undefined;
let isShuttingDown = false;

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  if (isShuttingDown) {
    return;
  }

  dbglogger('Received shutdown signal, shutting down gracefully...');
  isShuttingDown = true;

  if (temporalClient) {
    await temporalClient.connection.close();
    dbglogger('Temporal client connection closed.');
  }

  process.exit(0);
}

async function createClient() {
  // Connect to the default Server location
  const connection = await Connection.connect({ address: 'localhost:7233' });
  // In production, pass options to configure TLS and other settings:
  // {
  //   address: 'foo.bar.tmprl.cloud',
  //   tls: {}
  // }

  return new Client({
    connection,
    // namespace: 'foo.bar', // connects to 'default' namespace if not specified
  });
}

app.use(
  cors({
    origin: 'http://127.0.0.1:5173',
    credentials: true,
  }),
);

app.get('/', (req: Request, res: Response) => {
  dbglogger('Received request to root endpoint');
  res.send('Game Server Status: up and running');
});

// TODO: NOTE - using GET for quick and easy testing from a browser purposes need to come back and refactor routes

// TODO: This should be a POST request: POST /game/:gameId
app.get('/start/:gameId', async (req: Request, res: Response) => {
  const { gameId } = req.params;
  const playerId = 'player 1';
  dbglogger(`Received request to start game with workflow ID ${gameId}`);

  const startWorkflowOperation = new WithStartWorkflowOperation(runGame, {
    workflowId: gameId,
    args: [],
    taskQueue: TASK_QUEUE_NAME,
    workflowIdConflictPolicy: 'FAIL',
  });

  const recievedPlayerId = await temporalClient?.workflow.executeUpdateWithStart(addPlayerUpdate, {
    startWorkflowOperation,
    args: [{ requestedPlayerId: playerId }],
  });

  const handle = await startWorkflowOperation.workflowHandle();
  dbglogger(`handle: ${JSON.stringify(handle)}`);

  dbglogger(`Game Start Queued with workflow ID: ${gameId}`);
  res.json({ gameId, playerId: recievedPlayerId });
});

// TODO: this should be a GET request to /game/:gameId
app.get('/inspect/:gameId', async (req: Request, res: Response) => {
  const { gameId } = req.params;
  dbglogger(`Received request to inspect game ${gameId}`);

  const handle = temporalClient?.workflow.getHandle(gameId);
  const result = await handle?.query(getGameStateQuery, { gameId });

  if (result) {
    dbglogger(`Game state for ${gameId}: ${JSON.stringify(result)}`);
    res.json(result);
  } else {
    dbglogger(`No game found with ID ${gameId}`);
    res.status(404).json({ error: 'Game not found' });
  }
});

// TODO: This should be a POST request
app.get('/join/:gameId/:playerId', async (req: Request, res: Response) => {
  const { gameId, playerId } = req.params;
  dbglogger(`Received request to join game ${gameId} with player ID ${playerId}`);

  const handle = temporalClient?.workflow.getHandle(gameId);
  const addPlayerResponse = await handle?.executeUpdate(addPlayerUpdate, {
    args: [{ requestedPlayerId: playerId }],
  });

  dbglogger(`Added player ID: ${addPlayerResponse?.playerId}`);
  res.json({ gameId, playerId: addPlayerResponse });
});

// TODO: This should be a POST request: POST /game/:gameId/player/:playerId/doodle
app.get('/doodle/:gameId/:playerId', async (req: Request, res: Response) => {
  const { gameId, playerId } = req.params;
  // const doodleFilePath = `/tmp/${gameId}-${playerId}-doodle.png`;
  const doodleFilePath = `/tmp/test-doodle-${playerId.replace(' ', '-')}.png`;
  // TODO Remove prompt stubs and get it from the POST payload
  const prompt =
    playerId === 'player 1'
      ? 'Inspired by my doodle, generate a giant arachnid-like monster angled facing to the right. It is a tarantula from outer space. It shoots red-hot plasma from its eyes and the tail produces clouds of green noxious gas.'
      : 'Inspired by my doodle, generate a giant arachnid-like monster angled facing to the left. It is a steampunk automoton version of a scorpion. It shoots glowing red "retro ray gun-styled" rays from its eyes and the tail emits sparks of green lightning.';
  const style = 'retro sci-fi pulp magazine illustration';

  dbglogger(`Received request to generate monster image for game ${gameId} for player ${playerId}`);

  const handle = temporalClient?.workflow.getHandle(gameId);
  await handle?.signal(startMonsterImageGen, {
    playerId,
    doodleFilePath,
    prompt,
    style,
  });

  res.json({ gameId, playerId });
});

interface MonsterConfigCreateRouteParams {
  gameId: GameId;
  playerId: PlayerId;
}

// TODO: This should be a POST request: POST /game/:gameId/player/:playerId/monster-config
app.get(
  '/game/:gameId/player/:playerId/monster-config',
  async (req: Request<MonsterConfigCreateRouteParams, unknown, unknown, MonsterConfig>, res: Response) => {
    const { gameId, playerId } = req.params;
    const { name, description, monsterType, attackTypes, specialAbilities, power, defense, speed, maxHealth } =
      req.query;

    const attackTypesArray = Array.isArray(attackTypes) ? attackTypes : [attackTypes];
    const specialAbilitiesArray =
      specialAbilities && Array.isArray(specialAbilities) ? specialAbilities : [specialAbilities];

    const monsterConfig: MonsterConfig = {
      name,
      description,
      monsterType,
      attackTypes: attackTypesArray,
      specialAbilities: specialAbilitiesArray,
      power: +power,
      defense: +defense,
      speed: +speed,
      maxHealth: +maxHealth,
      // TODO Ideally the attributes below become dynamically calcuable and not needed to be slammed in here
      currentHealth: +maxHealth,
      startingVitality: Vitality.Fresh,
      currentVitality: Vitality.Fresh,
    };

    dbglogger(`Received request to save monster config for game ${gameId} for player ${playerId}`);
    dbglogger(`Monster config: ${JSON.stringify(monsterConfig)}`);

    const handle = temporalClient?.workflow.getHandle(gameId);
    await handle?.signal(saveMonsterConfig, {
      playerId,
      config: monsterConfig,
    });

    res.status(200).send();
  },
);

app.listen(port, async () => {
  dbglogger('Connecting to Temporal server.');
  temporalClient = await createClient();
  dbglogger('Connected to Temporal server.');

  dbglogger(`Server is listening (port: ${port}).`);
});
