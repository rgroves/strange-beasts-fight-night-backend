// =====================================
// === Game Related Types/Interfaces ===
// =====================================
export type GameId = string;
export type PlayerId = string;
export type FilePath = string;

export type Player = {
  id: PlayerId;
};

export type GameState = {
  state: 'LobbyPhase' | 'DrawingPhase' | 'MonsterConfigPhase' | 'BattleResolutionPhase' | 'GameOver';
  maxPlayers: number;
  players: Player[];
  monsterImageMap: Record<PlayerId, FilePath>;
};

// ======================================
// === Temporal Signal I/O Interfaces ===
// ======================================
export interface StartMonsterImageGenInput {
  playerId: PlayerId;
  doodleFilePath: FilePath;
  prompt: string;
  style: string;
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
