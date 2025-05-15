/*
*** NOTES/IDEAS ***

Attack Damage Ranges: 
  - Miss (0)
  - Glancing Blow (1-3; 1d6/2)
  - Direct Hit (4-6; 3 + 1d6/2)
  - Critical Hit (7-18; 6 + 1d6 * 2)

Max Health (starting health)
Health (current health) 

Health Level: round(health / maxHealth) * 100
Vitality (health level): Fresh (100-81), Worn (80-61), Wounded (60-41), Injured (40-21), Critical (20-1), Dead (0)
*/

enum Vitality {
  Fresh = 'Fresh',
  Worn = 'Worn',
  Wounded = 'Wounded',
  Critical = 'Critical',
  Dead = 'Dead',
}

enum AttackResult {
  Miss = 'Miss',
  GlancingBlow = 'Glancing Blow',
  DirectHit = 'Direct Hit',
  CriticalHit = 'Critical Hit',
}

interface MonsterDetails {
  name: string;
  monsterType: string;
  attackTypes: string[];
  maxHealth: number;
  currentHealth: number;
}

interface Attack {
  attacker: string;
  target: string;
  result: string;
}

interface Turn {
  attacks: Attack[];
  endOfTurnStatus: { fighter: string; vitality: Vitality }[];
}

interface FightDetails {
  fighters: MonsterDetails[];
  turns: Turn[];
  outcome: string;
}

const fighters: MonsterDetails[] = [
  {
    name: 'Godzilla',
    monsterType: 'Kaiju',
    attackTypes: ['bite', 'tail swipe', 'fire breath'],
    maxHealth: 30,
    currentHealth: 30,
  },
  {
    name: 'Mothra',
    monsterType: 'Kaiju',
    attackTypes: ['wing flap', 'poison gas', 'sonic roar'],
    maxHealth: 30,
    currentHealth: 30,
  },
  {
    name: 'King Kong',
    monsterType: 'Kaiju',
    attackTypes: ['claw', 'bite', 'tail whip'],
    maxHealth: 30,
    currentHealth: 30,
  },
  {
    name: 'Gamera',
    monsterType: 'Kaiju',
    attackTypes: ['fire breath', 'tail slam', 'rock throw'],
    maxHealth: 30,
    currentHealth: 30,
  },
  {
    name: 'Rodan',
    monsterType: 'Kaiju',
    attackTypes: ['wing flap', 'lightning strike', 'sonic roar'],
    maxHealth: 30,
    currentHealth: 30,
  },
  {
    name: 'Mechagodzilla',
    monsterType: 'Mecha',
    attackTypes: ['laser beam', 'spike throw', 'tail whip'],
    maxHealth: 30,
    currentHealth: 30,
  },
  {
    name: 'Gigan',
    monsterType: 'Kaiju',
    attackTypes: ['claw', 'eye beam', 'acid spit'],
    maxHealth: 30,
    currentHealth: 30,
  },
  {
    name: 'Anguirus',
    monsterType: 'Kaiju',
    attackTypes: ['bite', 'tail slam', 'rock throw'],
    maxHealth: 30,
    currentHealth: 30,
  },
  {
    name: 'Biollante',
    monsterType: 'Kaiju',
    attackTypes: ['poison gas', 'tail whip', 'fire breath'],
    maxHealth: 30,
    currentHealth: 30,
  },
  {
    name: 'Hedorah',
    monsterType: 'Kaiju',
    attackTypes: ['acid spit', 'poison gas', 'sonic roar'],
    maxHealth: 30,
    currentHealth: 30,
  },
];

function getRandomFighter() {
  const randomIndex = Math.floor(Math.random() * fighters.length);
  return fighters[randomIndex];
}

const attackTypes = [
  'bite',
  'claw',
  'tail swipe',
  'fire breath',
  'lightning strike',
  'poison gas',
  'sonic roar',
  'laser beam',
  'spike throw',
  'tail whip',
  'eye beam',
  'acid spit',
  'rock throw',
  'tail slam',
  'wing flap',
];

function getRandomAttackType() {
  const randomIndex = Math.floor(Math.random() * attackTypes.length);
  return attackTypes[randomIndex];
}

const attackResults = [AttackResult.Miss, AttackResult.GlancingBlow, AttackResult.DirectHit, AttackResult.CriticalHit];

function getRandomAttackResult() {
  const randomIndex = Math.floor(Math.random() * attackResults.length);
  return attackResults[randomIndex];
}

function determineDamage(attackResut: AttackResult) {
  switch (attackResut) {
    case AttackResult.Miss:
      return 0;
    case AttackResult.GlancingBlow:
      return 1 + Math.floor(Math.random() * 6) / 2;
      return 3;
    case AttackResult.DirectHit:
      return 3 + Math.floor(Math.random() * 6) / 2;
    case AttackResult.CriticalHit:
      return 6 + Math.floor(Math.random() * 6) * 2;
    default:
      return 0;
  }
}

function determineCurrentVitality(health: number, maxHealth: number) {
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
function generateFightDetails(): FightDetails {
  const fightDetails: FightDetails = {
    fighters: [],
    turns: [],
    outcome: '',
  };

  // Generate two random fighters
  const fighter1 = getRandomFighter();
  const fighter2 = getRandomFighter();

  // Add fighters to the fight details
  fightDetails.fighters.push(fighter1, fighter2);

  // Simulate a few turns of combat
  for (let i = 0; i < 5; i++) {
    const turn: Turn = {
      attacks: [],
      endOfTurnStatus: [],
    };

    // Fighter 1 attacks Fighter 2
    const attackResult1 = getRandomAttackResult();
    const damage1 = determineDamage(attackResult1);
    fighter2.currentHealth -= damage1;
    turn.attacks.push({
      attacker: fighter1.name,
      target: fighter2.name,
      result: attackResult1,
    });

    // Fighter 2 attacks Fighter 1
    const attackResult2 = getRandomAttackResult();
    const damage2 = determineDamage(attackResult2);
    fighter1.currentHealth -= damage2;
    turn.attacks.push({
      attacker: fighter2.name,
      target: fighter1.name,
      result: attackResult2,
    });

    // Update fighters' vitality status
    const fighter1CurrentVitality = determineCurrentVitality(fighter1.currentHealth, fighter1.maxHealth);
    const fighter2CurrentVitality = determineCurrentVitality(fighter2.currentHealth, fighter2.maxHealth);

    turn.endOfTurnStatus.push(
      { fighter: fighter1.name, vitality: fighter1CurrentVitality },
      { fighter: fighter2.name, vitality: fighter2CurrentVitality },
    );

    fightDetails.turns.push(turn);
  }

  // Determine the outcome of the fight
  if (fighter1.currentHealth <= 0 && fighter2.currentHealth <= 0) {
    fightDetails.outcome = 'Draw';
  } else if (fighter1.currentHealth <= 0 || fighter2.currentHealth > fighter1.currentHealth) {
    fightDetails.outcome = `${fighter2.name} wins`;
  } else if (fighter2.currentHealth <= 0 || fighter1.currentHealth > fighter2.currentHealth) {
    fightDetails.outcome = `${fighter1.name} wins`;
  }

  return fightDetails;
}

const details = generateFightDetails();
console.log(`<FIGHT_DETAILS>${JSON.stringify(details)}</FIGHT_DETAILS>`);
