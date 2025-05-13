import { Connection, Client, WithStartWorkflowOperation } from '@temporalio/client';
import express, { Request, Response } from 'express';
import debug from 'debug';

import { addPlayerUpdate, getGameStateQuery, TASK_QUEUE_NAME } from '../shared';
import { runGame } from '../workflows';

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
    // Close the Temporal client connection
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

app.get('/', (req: Request, res: Response) => {
  dbglogger('Received request to root endpoint');
  res.send('Game Server Status: up and running');
});

app.get('/start/:workflowId', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const playerId = 'player 1';
  dbglogger(`Received request to start game with workflow ID ${workflowId}`);

  const startWorkflowOperation = new WithStartWorkflowOperation(runGame, {
    workflowId,
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

  dbglogger(`Game Start Queued with workflow ID: ${workflowId}`);
  res.json({ gameId: workflowId, playerId: recievedPlayerId });
});

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

app.get('/join/:gameId/:playerId', async (req: Request, res: Response) => {
  const { gameId, playerId } = req.params;
  dbglogger(`Received request to join game ${gameId} with player ID ${playerId}`);

  const handle = temporalClient?.workflow.getHandle(gameId);
  const recievedPlayerId = await handle?.executeUpdate(addPlayerUpdate, {
    args: [{ requestedPlayerId: playerId }],
  });

  dbglogger(`Added player ID: ${recievedPlayerId}`);
  res.json({ gameId, playerId: recievedPlayerId });
});

app.listen(port, async () => {
  dbglogger('Connecting to Temporal server.');
  temporalClient = await createClient();
  dbglogger('Connected to Temporal server.');

  dbglogger(`Server is listening (port: ${port}).`);
});
