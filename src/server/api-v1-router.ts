import debug from 'debug';
import express, { Request, Response } from 'express';
import temporalClient from './temporal-client';
import GameController from './game-controller';

const dbglogger = debug('giant-monster-brawl:server:api-v1-router');

const gameController = new GameController(temporalClient);
const apiV1Router = express.Router();
apiV1Router.use(express.json());

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

export default apiV1Router;
