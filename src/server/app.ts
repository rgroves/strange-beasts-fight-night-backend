import { config } from 'dotenv';
import express from 'express';
import path from 'path';
import debug from 'debug';
import cors from 'cors';

import temporalClient from './temporal-client';
import apiV1Router from './api-v1-router';

config();

const dbglogger = debug('giant-monster-brawl:server');
const app = express();
const port = 3000;

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

console.log(`cors origin: ${process.env.FRONT_END_ORIGIN}`);
app.use(
  cors({
    origin: process.env.FRONT_END_ORIGIN,
    credentials: true,
  }),
);

const staticPath = path.join(__dirname, 'public', 'game-assets');
dbglogger(`Serving static files from: ${staticPath}`);
app.use('/static/', express.static(staticPath));

app.use('/api/v1/', apiV1Router);

app.listen(port, async () => {
  dbglogger(`Server is listening (port: ${port}).`);
});
