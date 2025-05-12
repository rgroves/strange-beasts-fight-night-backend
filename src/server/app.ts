import { Connection, Client } from '@temporalio/client';
import express, { Request, Response } from 'express';
import { TASK_QUEUE_NAME } from '../shared';
import { nanoid } from 'nanoid';
import debug from 'debug';

const dbglogger = debug('monster-battle-mania:server');
let temporalClient: Client;

const app = express();
const port = 3000;

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  dbglogger('Received shutdown signal, shutting down gracefully...');
  if (temporalClient) {
    // Close the Temporal client connection
    await temporalClient.connection.close();
    dbglogger('Temporal client connection closed.');
  }
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

app.get('/', async (req: Request, res: Response) => {
  res.send('ready');
  const handle = await temporalClient.workflow.start('runGame', {
    taskQueue: TASK_QUEUE_NAME,
    // type inference works! args: [name: string]
    args: ['Temporal'],
    // in practice, use a meaningful business ID, like customerId or transactionId
    workflowId: 'workflow-' + nanoid(),
  });
  dbglogger(`Started workflow ${handle.workflowId}`);

  // optional: wait for client result
  dbglogger(await handle.result());
});

app.listen(port, async () => {
  temporalClient = await createClient();
  dbglogger(`Server listening on port ${port}`);
});
