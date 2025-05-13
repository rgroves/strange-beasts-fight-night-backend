// =====================================
// === Game Related Types/Interfaces ===
// =====================================
export type Player = {
  id: string;
};

export type GameState = {
  state: 'LobbyPhase' | 'PlayerSetupPhase' | 'AISetupPHase' | 'BattleResolutionPhase' | 'GameOver';
  players: Player[];
};

// ======================================
// === Temporal Update I/O Interfaces ===
// ======================================
export interface AddPlayerInput {
  requestedPlayerId: string;
}

export interface AddPlayerOuptut {
  playerId: string;
}

// =====================================
// === Temporal Query I/O Interfaces ===
// =====================================
export interface GetGameStateInput {
  gameId: string;
}
