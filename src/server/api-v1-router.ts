import debug from 'debug';
import express, { Request, Response } from 'express';
import temporalClient from './temporal-client';
import GameController from './game-controller';
import { GameNotFoundError } from './game-errors';

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

export default apiV1Router;
