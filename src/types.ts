/**
 * Utility function to convert value of enum T to the string value of its
 * corresponding key string with type keyof typeof T ensuring type safety.
 * @param enumType
 * @param enumValue
 * @returns A string representation of the enum value.
 * @throws RangeError if the enum value is not valid.
 * @template T - The enum type.
 * @template TS - The string type of the enum.
 * @example
 * enum MyEnum {
 *    A,
 *    B
 * }
 * type MyEnumString = keyof typeof MyEnum;
 *
 * const myEnumValue = enumToString<typeof MyEnum, MyEnumString>(MyEnum, 1); // "B}
 */
const enumToString = <T, TS>(enumType: T, enumValue: number): TS => {
  if (!Object.values(enumType as object).includes(enumValue)) {
    throw RangeError(`Invalid enum value: ${enumValue}`);
  }
  return enumType[enumValue as keyof T] as TS;
};

/**
 * Utility function to convert value of enum T to the index of its corresponding
 * key string with type keyof typeof T ensuring type safety.
 * @param enumType
 * @param enumValue
 * @returns The corresponding index of the enum value.
 * @throws RangeError if the enum value is not valid.
 * @template TT - The enum type.
 * @template T - The enum value type.
 * @example
 * enum MyEnum {
 *   A,
 *   B,
 * }
 *
 * const myEnumValue = enumToIndex<typeof MyEnum, MyEnum>(MyEnum, MyEnum.A); // 0
 * const myEnumValue2 = enumToIndex<typeof MyEnum, MyEnum>(MyEnum, MyEnum.B); // 1
 */
const enumToIndex = <TT, T>(enumType: TT, enumValue: T) => {
  const index = Object.values(enumType as object).indexOf(enumValue);
  if (index === -1) {
    throw RangeError(`Invalid enum value: ${enumValue}`);
  }
  return index;
};

export const getVitalityIndex = (vitality: Vitality) => enumToIndex<typeof Vitality, Vitality>(Vitality, vitality);

// =====================================
// === Game Related Types/Interfaces ===
// =====================================
export type GameId = string;
export type PlayerId = string;
export type FilePath = string;
export type AbilityScore = number;
export type HealthScore = number;

export interface Player {
  id: PlayerId;
  monsterDescription?: string;
}

export interface GameState {
  state:
    | 'LobbyPhase'
    | 'DrawingPhase'
    | 'MonsterConfigPhase'
    | 'BattleResolutionPhase'
    | 'BattleCommentaryPhase'
    | 'AudioGenerationPhase'
    | 'GameOver';
  maxPlayers: number;
  playersMap: Record<PlayerId, Player>;
  monsterImageMap: Record<PlayerId, FilePath>;
  monsterConfigMap: Record<PlayerId, MonsterConfig>;
  battleAudioFileName: FilePath;
}

export interface MonsterConfig {
  name: string;
  description: string;
  monsterType: string;
  attackTypes: string[];
  specialAbilities: string[];
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

export enum ActionResult {
  Defending = 'Defending',
  Miss = 'Miss',
  GlancingBlow = 'Glancing Blow',
  DirectHit = 'Direct Hit',
  CriticalHit = 'Critical Hit',
}

export interface Attack {
  attacker: string;
  target: string;
  attackType: string | null;
  damage: number;
  result: ActionResult;
}

export interface FighterStatus {
  fighter: string;
  vitality: Vitality;
}

export interface Turn {
  attacks: Attack[];
  endOfTurnStatus: FighterStatus[];
}

export interface FightDetails {
  fighters: MonsterConfig[];
  turns: Turn[];
  outcome: string;
}

// ======================================
// === Temporal Signal I/O Interfaces ===
// ======================================
export interface StartMonsterImageGenInput {
  playerId: PlayerId;
  doodleFileName: string;
  monsterDescription: string;
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
