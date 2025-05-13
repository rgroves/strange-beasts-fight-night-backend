import { defineUpdate, defineQuery } from '@temporalio/workflow';
import { AddPlayerInput, AddPlayerOuptut, GameState, GetGameStateInput } from './types';

export const TASK_QUEUE_NAME = 'giant-monster-brawl';

export const addPlayerUpdate = defineUpdate<AddPlayerOuptut, [AddPlayerInput]>('addPlayer');

export const getGameStateQuery = defineQuery<GameState, [GetGameStateInput]>('getGameState');
