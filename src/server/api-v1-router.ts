import fs from 'fs';
import path from 'path';

import debug from 'debug';
import express, { Request, Response } from 'express';

import temporalClient from './temporal-client';
import GameController from './game-controller';
import { GameNotFoundError } from './game-errors';
import { GAME_ASSETS_DIR } from '../nd-shared';
import { MonsterConfig, Vitality } from '../types';

const dbglogger = debug('giant-monster-brawl:server:api-v1-router');

const gameController = new GameController(temporalClient);
const apiV1Router = express.Router();
apiV1Router.use(express.json({ limit: '1mb' }));

apiV1Router.get('/', (req: Request, res: Response) => {
  dbglogger('Received request to root endpoint');
  res.send('Game Server Status: 🟢 Up');
});

apiV1Router.post('/game/', async (request: Request, res: Response) => {
  dbglogger(`Received request to create a new game.`);
  const { playerId: requestedPlayerId } = request.body;
  const { gameId, playerId } = await gameController.startGame({ playerId: requestedPlayerId });
  res.send({ gameId, playerId });
});

apiV1Router.get('/game/:gameId', async (req: Request, res: Response) => {
  const { gameId } = req.params;
  dbglogger(`Received request for state of game: ${gameId}`);

  try {
    const gameState = await gameController.getGameState(gameId);
    res.json(gameState);
  } catch (error) {
    if (error instanceof GameNotFoundError) {
      dbglogger(`No game found with gameId: ${gameId}`);
      res.status(404).json({});
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      dbglogger(`Failed to retrieve game state; ${errorMessage}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

apiV1Router.put('/game/:gameId/player/:requestedPlayerId', async (req: Request, res: Response) => {
  const { gameId, requestedPlayerId } = req.params;
  dbglogger(`Received request to join game ${gameId} with player ID ${requestedPlayerId}`);
  const { playerId } = await gameController.addPlayer({ gameId, requestedPlayerId });
  dbglogger(`Added player ID: ${playerId}`);
  res.json({ gameId, playerId });
});

apiV1Router.put('/game/:gameId/player/:playerId/doodle', async (req: Request, res: Response) => {
  const { gameId, playerId } = req.params;
  dbglogger(`Received request to save doodle for game ${gameId} player ${playerId}`);
  const { image: dataUri, monsterDescription } = req.body;
  dbglogger('...with monster description:', monsterDescription);
  dbglogger('...with doodle data URI:', dataUri);

  const matches = dataUri.match(/^data:(image\/png);base64,([A-Za-z0-9+/=]+)$/);

  if (!matches) {
    res.status(400).send('Invalid data URI');
    return;
  }

  const [, mimeType, base64Data] = matches;
  const imgBuf = Buffer.from(base64Data, 'base64');
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  if (!imgBuf.subarray(0, 8).equals(pngSignature)) {
    res.status(400).send('Not a valid PNG file');
    return;
  }

  if (mimeType !== 'image/png') {
    res.status(400).send('Not a PNG file');
    return;
  }

  const doodleFileName = `${gameId}-${playerId}-doodle.png`;
  const filePath = path.join(GAME_ASSETS_DIR, doodleFileName);
  await fs.promises.writeFile(filePath, imgBuf);
  dbglogger(`Saved player ${playerId} doodle to ${filePath}`);

  dbglogger(`Received request to generate monster image for game ${gameId} for player ${playerId}`);

  await gameController.uploadDoodle({
    gameId,
    playerId,
    monsterDescription,
    doodleFileName,
  });

  res.json({ fileName: doodleFileName });
});

apiV1Router.put('/game/:gameId/player/:playerId/monster-config', async (req: Request, res: Response) => {
  const { gameId, playerId } = req.params;
  const { name, description, monsterType, attackTypes, specialAbilities, power, defense, speed, maxHealth } = req.body;
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

  await gameController.uploadMonsterConfig({
    gameId,
    playerId,
    monsterConfig,
  });

  res.status(200).send();
});

export default apiV1Router;
