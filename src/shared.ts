import { defineUpdate, defineQuery, defineSignal } from '@temporalio/workflow';

import {
  AddPlayerInput,
  AddPlayerOuptut,
  GameState,
  GetGameStateInput,
  SaveMonsterConfigInput,
  StartMonsterImageGenInput,
} from './types';

export const TASK_QUEUE_NAME = 'giant-monster-brawl';

export const startMonsterImageGen = defineSignal<[StartMonsterImageGenInput]>('startMonsterImageGen');
export const saveMonsterConfig = defineSignal<[SaveMonsterConfigInput]>('saveMonsterConfig');

export const addPlayerUpdate = defineUpdate<AddPlayerOuptut, [AddPlayerInput]>('addPlayer');

export const getGameStateQuery = defineQuery<GameState, [GetGameStateInput]>('getGameState');
