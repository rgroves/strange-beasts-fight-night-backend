import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { Attack, ActionResult, FightDetails, getVitalityIndex, MonsterConfig, Vitality, GameId } from './types';

const LOGGING_ENABLED = false;
const COMPACT_OUTPUT = true;

const stringify = (obj: any) => JSON.stringify(obj, null, 2);
const format_results = COMPACT_OUTPUT ? JSON.stringify : stringify;

const roll1d6 = () => Math.floor(Math.random() * 6) + 1;
const randomModifier = () => Math.floor(Math.random() * 100) / 100;

function log(...args: any[]) {
  if (LOGGING_ENABLED) {
    console.log(...args);
  }
}

export default async function generateMockBattle(gameId: GameId, monsterConfigMap: Record<string, MonsterConfig>) {
  log(`Monster config map: ${stringify(monsterConfigMap)}`);
  log('\n\n========================');
  log('=== Fight Simulation ===');
  log('========================\n\n');

  const MAX_ROUNDS = 5;

  const fightData: FightDetails = {
    fighters: Object.entries(monsterConfigMap).map((config) => {
      const [id, monsterConfig] = config;

      return {
        name: monsterConfig.name,
        description: monsterConfig.description,
        monsterType: monsterConfigMap[id].monsterType,
        attackTypes: monsterConfigMap[id].attackTypes,
        specialAbilities: monsterConfigMap[id].specialAbilities,
        power: monsterConfigMap[id].power,
        defense: monsterConfigMap[id].defense,
        speed: monsterConfigMap[id].speed,
        maxHealth: monsterConfigMap[id].maxHealth,
        currentHealth: monsterConfigMap[id].maxHealth,
        startingVitality: monsterConfigMap[id].startingVitality,
        currentVitality: monsterConfigMap[id].currentVitality,
      };
    }),
    turns: [],
    outcome: '',
  };

  for (let round = 0; round < MAX_ROUNDS; round++) {
    log(`\n***\n>>> Round ${round + 1} starts`);
    const attacks: Attack[] = [];

    const fighterOrder = getFighterOrder(round, fightData.fighters);
    log(`Fighter order: ${stringify(fighterOrder.map((fighter) => fighter.name))}`);

    const fighterActions: string[] = [];
    const possibleActions = ['Attack', 'Attack', 'Attack', 'Attack', 'Defend', 'Special Attack', 'Special Attack'];
    for (let i = 0; i < fightData.fighters.length; i++) {
      const action = possibleActions[Math.floor(Math.random() * possibleActions.length)];
      fighterActions.push(action);
    }

    for (let i = 0; i < fighterOrder.length; i++) {
      log(`\n***\n--> Round ${round + 1} Attack`);
      const attacker = fighterOrder[i];

      const targetIdx = (i + 1) % fighterOrder.length;
      const target = fighterOrder[targetIdx];
      const targetAction = fighterActions[targetIdx];
      log(
        `Attacker: ${attacker.name} (P:${attacker.power}, S:${attacker.speed}), Target: ${target.name} (D:${target.defense}, S:${target.speed})`,
      );

      const attackerAction = fighterActions[i];
      log(`Action chosen: ${attackerAction}`);

      let attackType = attacker.attackTypes[Math.floor(Math.random() * attacker.attackTypes.length)];

      switch (attackerAction) {
        case 'Defend':
          attackType = 'Defend';
          break;

        case 'Special Attack':
          if (attacker.specialAbilities) {
            attackType = attacker.specialAbilities[Math.floor(Math.random() * attacker.specialAbilities.length)];
          }
          break;
      }

      log(`Attack type: ${attackType}`);

      let hit = false;
      let damage = 0;
      let result: ActionResult = ActionResult.Defending;

      if (attackType !== 'Defend') {
        const attackBonus = Math.ceil(Math.max(0, attacker.speed - target.speed) / 2);
        const attackDiceCnt = attacker.power + attackBonus;
        const attackRolls = Array.from({ length: attackDiceCnt }, () => roll1d6());
        const attackRoll = Math.max(...attackRolls);
        log(`Attack roll: ${attackRoll} (Rolls: ${attackRolls.join(', ')}; Attack Bonus Dice: ${attackBonus})`);

        const defenseBonus = Math.ceil(Math.max(0, target.speed - attacker.speed) / 2);
        const defenseDiceCnt = target.defense + defenseBonus;
        const defenseRolls = Array.from({ length: defenseDiceCnt }, () => roll1d6());
        const defenseRoll = Math.max(...defenseRolls);
        log(`Defense roll: ${defenseRoll} (Rolls: ${defenseRolls.join(', ')}; Defense Bonus Dice: ${defenseBonus})`);

        hit = attackRoll > defenseRoll || attackRoll === 6;

        if (hit) {
          damage = Math.max(1, attackRoll - defenseRoll);

          if (attackRoll === 6) {
            damage += 1;
          } else if (targetAction === 'Defend') {
            damage = Math.ceil(damage / 2);
          }

          log(`Hit: ${hit}, Damage: ${damage}`);

          target.currentHealth = Math.max(0, target.currentHealth - damage);

          switch (damage) {
            case 1:
            case 2:
              result = ActionResult.GlancingBlow;
              break;
            case 3:
            case 4:
              result = ActionResult.DirectHit;
              break;
            case 5:
            case 6:
              result = ActionResult.CriticalHit;
              break;

            default:
              result = ActionResult.Miss;
              damage = 0;
          }
        } else {
          log(`${attacker.name} misses ${target.name}`);
          result = ActionResult.Miss;
        }
      } else {
        log(`${attacker.name} defends against ${target.name}`);
        damage = 0;
        result = ActionResult.Defending;
      }

      const attack: Attack = {
        attacker: attacker.name,
        target: target.name,
        attackType,
        damage,
        result,
      };

      attacks.push(attack);

      log(`${target.name} takes ${damage} damage, current health: ${target.currentHealth}`);

      if (target.currentHealth === 0) {
        break;
      }
    }

    log(`\n***\n>>> Round ${round + 1} attacks: ${stringify(attacks)}`);

    const endOfTurnStatus = fightData.fighters.map((fighter) => {
      const { name, currentHealth, maxHealth } = fighter;
      const vitality = determineVitality(currentHealth, maxHealth);
      fighter.currentVitality = vitality;
      return { fighter: name, vitality };
    });

    fightData.turns.push({
      attacks,
      endOfTurnStatus,
    });

    if (fightData.fighters.some((fighter) => fighter.currentHealth <= 0)) {
      break;
    }
  }

  const winners = fightData.fighters.reduce<MonsterConfig[]>(
    (acc, fighter, idx) => {
      if (idx > 0) {
        if (getVitalityIndex(fighter.currentVitality) < getVitalityIndex(acc[acc.length - 1].currentVitality)) {
          return [fighter];
        } else if (fighter.currentVitality === acc[acc.length - 1].currentVitality) {
          const curFighterDamage = fighter.maxHealth - fighter.currentHealth;
          const accFighterDamage = acc[acc.length - 1].maxHealth - acc[acc.length - 1].currentHealth;
          if (curFighterDamage < accFighterDamage) {
            return [fighter];
          } else if (curFighterDamage === accFighterDamage) {
            return [...acc, fighter];
          }
        }
      }
      return acc;
    },
    [fightData.fighters[0]],
  );
  log(`\n***\n>>> Fight winners: ${stringify(winners.map((fighter) => fighter.name))}`);

  if (winners.length === 1) {
    fightData.outcome = `${winners[0].name} wins`;
  } else {
    fightData.outcome = 'Draw';
  }

  log(
    `\n***\n ===> Fighter Health: ${stringify(
      fightData.fighters.map((fighter) => `${fighter.name}: ${fighter.currentHealth}`),
    )}`,
  );
  log(
    `\n***\n ===> Fighter Vitality: ${stringify(
      fightData.fighters.map((fighter) => `${fighter.name}: ${fighter.currentVitality}`),
    )}`,
  );

  const results = `<FIGHT_DETAILS>${format_results(fightData)}</FIGHT_DETAILS>`;
  const filePath = await saveFightDetails(gameId, results);

  log(`\n***\n ===> Fight Outcome: ${fightData.outcome}`);
  log(`\n***\nFight data after battle:`);
  log(`\n${results}\n`);

  return { filePath };
}

function getFighterOrder(round: number, fighters: MonsterConfig[]) {
  const initiativeRolls = fighters.map((fighter) => {
    const { name, speed } = fighter;
    const roll = roll1d6() + speed + randomModifier();
    return { name, roll, fighter };
  });

  initiativeRolls.sort((a, b) => b.roll - a.roll);

  log(
    `Round ${round + 1} initiative rolls: ${stringify(
      initiativeRolls.map((rollData) => `${rollData.roll} - ${rollData.name}`),
    )}`,
  );

  return initiativeRolls.map((rollData) => rollData.fighter);
}

function determineVitality(health: number, maxHealth: number) {
  const healthPercentage = (health / maxHealth) * 100;
  if (healthPercentage > 75) {
    return Vitality.Fresh;
  } else if (healthPercentage > 50) {
    return Vitality.Worn;
  } else if (healthPercentage > 25) {
    return Vitality.Wounded;
  } else if (healthPercentage > 0) {
    return Vitality.Critical;
  } else {
    return Vitality.Dead;
  }
}

async function saveFightDetails(gameId: GameId, fightDetails: string) {
  const tmpDir = os.tmpdir();
  const fileName = `${gameId}-fight-details.txt`;
  const filePath = path.join(tmpDir, fileName);
  await fs.writeFile(filePath, fightDetails);
  return filePath;
}
