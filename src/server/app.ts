import express, { Request, Response } from 'express';
import path from 'path';
import debug from 'debug';
import cors from 'cors';

import { saveMonsterConfig } from '../shared';
import { GameId, MonsterConfig, PlayerId, Vitality } from '../types';
import temporalClient from './temporal-client';
import apiV1Router from './api-v1-router';

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

app.use(
  cors({
    origin: 'http://127.0.0.1:5173',
    credentials: true,
  }),
);

app.use('/static/gaem-assets', express.static(path.join(__dirname, 'public', 'game-assets')));

app.get('/', (req: Request, res: Response) => {
  dbglogger('Received request to root endpoint');
  res.send('Game Server Status: up and running');
});

// TODO: NOTE - using GET for quick and easy testing from a browser purposes need to come back and refactor routes

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

app.use('/api/v1/', apiV1Router);

app.listen(port, async () => {
  dbglogger(`Server is listening (port: ${port}).`);
});
