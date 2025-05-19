/*
*** NOTES/IDEAS ***

Ability Scores: 1-6

Attack Damage Ranges: 
  - Miss (0)
  - Glancing Blow (1-2)
  - Direct Hit (3-4)
  - Critical Hit (5-6)

Max Health (starting health)
Health (current health) 

Health Level: round(health / maxHealth) * 100
Vitality (health level): Fresh (100-81), Worn (80-61), Wounded (60-41), Injured (40-21), Critical (20-1), Dead (0)
*/
import fs from 'fs';

import { MonsterConfig, Vitality } from '../../types';
import generateMockBattle from '../../battle-logic';

const fighters: MonsterConfig[] = [
  {
    name: 'Godzilla',
    description: 'The King of the Monsters',
    monsterType: 'Kaiju',
    attackTypes: ['bite', 'claw', 'tail swipe'],
    specialAbilities: ['atomic breath', 'nuclear pulse'],
    power: 6,
    defense: 5,
    speed: 4,
    maxHealth: 6,
    currentHealth: 6,
    startingVitality: Vitality.Fresh,
    currentVitality: Vitality.Fresh,
  },
  {
    name: 'Mothra',
    description: 'The Queen of the Monsters',
    monsterType: 'Kaiju',
    attackTypes: ['bite', 'wing strike'],
    specialAbilities: ['laser-beam antennae', 'projectile stingers'],
    power: 5,
    defense: 4,
    speed: 5,
    maxHealth: 6,
    currentHealth: 6,
    startingVitality: Vitality.Fresh,
    currentVitality: Vitality.Fresh,
  },
  {
    name: 'King Kong',
    description: 'The Eighth Wonder of the World',
    monsterType: 'Kaiju',
    attackTypes: ['claw', 'bite'],
    specialAbilities: ['pneumatic fist', 'head butt'],
    power: 5,
    defense: 4,
    speed: 5,
    maxHealth: 6,
    currentHealth: 6,
    startingVitality: Vitality.Fresh,
    currentVitality: Vitality.Fresh,
  },
  {
    name: 'Gamera',
    description: 'The Guardian of the Universe',
    monsterType: 'Kaiju',
    attackTypes: ['fist strike', 'bite', 'fireball breath'],
    specialAbilities: ['electromagnetic shock wave', 'chest plasma beam'],
    power: 4,
    defense: 5,
    speed: 4,
    maxHealth: 6,
    currentHealth: 6,
    startingVitality: Vitality.Fresh,
    currentVitality: Vitality.Fresh,
  },
  {
    name: 'Rodan',
    description: 'The Fire Demon',
    monsterType: 'Kaiju',
    attackTypes: ['talon strike', 'beak bite', 'wing strike', 'chest spike', 'head spike'],
    specialAbilities: ['sonic boom', 'heat beam'],
    power: 4,
    defense: 5,
    speed: 4,
    maxHealth: 6,
    currentHealth: 6,
    startingVitality: Vitality.Fresh,
    currentVitality: Vitality.Fresh,
  },
  {
    name: 'Mechagodzilla',
    description: 'The Mechanical Godzilla',
    monsterType: 'Mecha',
    attackTypes: ['bite', 'claw', 'fist strike', 'tail drill', 'kick'],
    specialAbilities: ['proton scream', 'radiant space eye-beams', 'electromagnetic chest beam'],
    power: 6,
    defense: 6,
    speed: 3,
    maxHealth: 6,
    currentHealth: 6,
    startingVitality: Vitality.Fresh,
    currentVitality: Vitality.Fresh,
  },
  {
    name: 'Gigan',
    description: 'The Space Monster',
    monsterType: 'Kaiju',
    attackTypes: ['metal hook arms', 'tail pincer', 'flame breath'],
    specialAbilities: ['buzzsaw chest', 'laser eye beams', 'boomerang saw blades'],
    power: 5,
    defense: 4,
    speed: 5,
    maxHealth: 6,
    currentHealth: 6,
    startingVitality: Vitality.Fresh,
    currentVitality: Vitality.Fresh,
  },
  {
    name: 'Anguirus',
    description: 'The Armored Monster',
    monsterType: 'Kaiju',
    attackTypes: ['bite', 'spiked shell', 'vise-like bite', 'poison claw'],
    specialAbilities: ['sonic roar', 'rolls into a ball and charges'],
    power: 4,
    defense: 5,
    speed: 4,
    maxHealth: 6,
    currentHealth: 6,
    startingVitality: Vitality.Fresh,
    currentVitality: Vitality.Fresh,
  },
  {
    name: 'Biollante',
    description: 'The Plant Monster',
    monsterType: 'Kaiju',
    attackTypes: ['vine spears'],
    specialAbilities: ['radioactive corrosive sap'],
    power: 5,
    defense: 4,
    speed: 4,
    maxHealth: 6,
    currentHealth: 6,
    startingVitality: Vitality.Fresh,
    currentVitality: Vitality.Fresh,
  },
  {
    name: 'Hedorah',
    description: 'The Smog Monster',
    monsterType: 'Kaiju',
    attackTypes: ['sludge claw', 'sludge bite', 'sludge squeeze'],
    specialAbilities: ['toxic sludge bomb', 'corrosive mist', 'hedrium ray eye beams'],
    power: 4,
    defense: 4,
    speed: 5,
    maxHealth: 6,
    currentHealth: 6,
    startingVitality: Vitality.Fresh,
    currentVitality: Vitality.Fresh,
  },
];

function getRandomFighter(excludeName?: string): MonsterConfig {
  if (fighters.length === 0) {
    throw new Error('No fighters available');
  }

  let fighter: MonsterConfig;
  do {
    const randomIndex = Math.floor(Math.random() * fighters.length);
    fighter = fighters[randomIndex];
  } while (excludeName && fighter.name === excludeName);

  return fighter;
}

const fighter1 = getRandomFighter();
const fighter2 = getRandomFighter(fighter1.name);

const monsterConfigMap: Record<string, MonsterConfig> = {
  'player 1': fighter1,
  'player 2': fighter2,
};

const gameId = 'game-12345-mock-battle';

generateMockBattle(gameId, monsterConfigMap)
  .then(({ filePath }) => {
    console.log('Result:', filePath);

    console.log('Loading input from:', filePath);
    const input = fs.readFileSync(filePath, 'utf-8');
    console.log(input);
  })
  .catch((err) => {
    console.error(err);
  });
