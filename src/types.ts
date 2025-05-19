// =====================================
// === Game Related Types/Interfaces ===
// =====================================
export type GameId = string;
export type PlayerId = string;
export type FilePath = string;
export type AbilityScore = number;
export type HealthScore = number;

export type Player = {
  id: PlayerId;
};

export type GameState = {
  state: 'LobbyPhase' | 'DrawingPhase' | 'MonsterConfigPhase' | 'BattleResolutionPhase' | 'GameOver';
  maxPlayers: number;
  players: Player[];
  monsterImageMap: Record<PlayerId, FilePath>;
  monsterConfigMap: Record<PlayerId, MonsterConfig>;
};

export interface MonsterConfig {
  name: string;
  description: string;
  monsterType: string;
  attackTypes: string[];
  specialAbilities?: string[];
  power: AbilityScore;
  defense: AbilityScore;
  speed: AbilityScore;
  maxHealth: HealthScore;
  // TODO Ideally the attributes below become dynamically calcuable and not needed to be slammed in here
  currentHealth: HealthScore;
  startingVitality: Vitality;
  currentVitality: Vitality;
}

export enum Vitality {
  Fresh = 'Fresh',
  Worn = 'Worn',
  Wounded = 'Wounded',
  Critical = 'Critical',
  Dead = 'Dead',
}

// ======================================
// === Temporal Signal I/O Interfaces ===
// ======================================
export interface StartMonsterImageGenInput {
  playerId: PlayerId;
  doodleFilePath: FilePath;
  prompt: string;
  style: string;
}

export interface SaveMonsterConfigInput {
  playerId: PlayerId;
  config: MonsterConfig;
}

// ======================================
// === Temporal Update I/O Interfaces ===
// ======================================
export interface AddPlayerInput {
  requestedPlayerId: PlayerId;
}

export interface AddPlayerOuptut {
  playerId: PlayerId;
}

// =====================================
// === Temporal Query I/O Interfaces ===
// =====================================
export interface GetGameStateInput {
  gameId: GameId;
}
