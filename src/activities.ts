import { log } from '@temporalio/activity';
import crypto from 'crypto';
import { config } from 'dotenv';
import fs from 'fs/promises';
import OpenAI, { toFile } from 'openai';
import os from 'os';
import path from 'path';
import generateMockBattle from './battle-logic';
import { FilePath, GameId, MonsterConfig, PlayerId } from './types';
import { GAME_ASSETS_DIR } from './nd-shared';

config();

interface generateMonsterImageInput {
  doodleFileName: string;
  prompt: string;
  style: string;
}

interface generateMonsterImageOutput {
  monsterImageFileName: string;
}

const MONSTER_GEN_STUB = false; // TODO: Remove this stub when the real monster generation is needed
export async function generateMonsterImage(input: generateMonsterImageInput): Promise<generateMonsterImageOutput> {
  if (MONSTER_GEN_STUB) {
    log.info('Beast generation stub is enabled; returning stub image path.');
    return { monsterImageFileName: 'stub-monster-image.png' };
  }

  log.info(`Generating monster image with doodle file: ${JSON.stringify(input)}`);
  const { doodleFileName, prompt, style } = input;
  const doodleFilePath = path.resolve(GAME_ASSETS_DIR, doodleFileName);
  const doodleFileContent = await fs.readFile(doodleFilePath);
  const doodleFile = await toFile(doodleFileContent, doodleFileName, { type: 'image/png' });

  log.info('Initializing OpenAI API...');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
  });
  log.info('OpenAI API initialized.');

  log.info('Calling OpenAI API to generate image...');
  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: doodleFile,
    prompt: `${prompt}. Render in a ${style} style.`,
    n: 1,
    size: '1024x1024',
    quality: 'low',
    background: 'opaque',
  });
  log.info('OpenAI API response received.');

  if (!response.data || response.data.length === 0 || !response.data[0].b64_json) {
    throw new Error('No image data returned from OpenAI API');
  }

  const b64ImageData = response.data[0].b64_json;
  const imgBuffer = Buffer.from(b64ImageData, 'base64');
  const fileNamePart = doodleFileName.split('.').slice(0, -1).join('.');

  const monsterImageFileName = `${fileNamePart}-monster-image-${crypto.randomUUID()}.png`;
  const filePath = path.join(GAME_ASSETS_DIR, monsterImageFileName);

  log.info(`Saving image to: ${filePath}`);
  await fs.writeFile(filePath, imgBuffer);
  log.info('Image saved successfully.');

  return { monsterImageFileName };
}

interface generateBattleInput {
  gameId: GameId;
  monsterConfigMap: Record<PlayerId, MonsterConfig>;
}

interface generateMockBattleOutput {
  filePath: string;
}

export async function generateMockBattleData({
  gameId,
  monsterConfigMap,
}: generateBattleInput): Promise<generateMockBattleOutput> {
  log.info(`Generating mock battle data for game ID: ${gameId}`);
  return generateMockBattle(gameId, monsterConfigMap);
}

interface generateBattleCommentaryInput {
  gameId: GameId;
  fightDetailsFilePath: FilePath;
}

interface generateBattleCommentaryOutput {
  battleCommentaryfilePath: FilePath;
}

const BATTLE_COMMENTARY_STUB = false; // TODO: Remove this stub when the real battle commentary generation is needed
export async function generateBattleCommentary({
  gameId,
  fightDetailsFilePath,
}: generateBattleCommentaryInput): Promise<generateBattleCommentaryOutput> {
  // read prompt instruction from file fight-announcer-prompt.txt
  const inputFilePath = path.resolve(__dirname, './server/ai', 'fight-announcer-prompt.txt');
  log.info(`Loading input from: ${inputFilePath}`);
  const prompt = await fs.readFile(inputFilePath, 'utf-8');

  const fightDetails = await fs.readFile(fightDetailsFilePath, 'utf-8');
  log.info(`Fight details loaded from: ${fightDetailsFilePath}`);

  log.info(`The prompt is: ${prompt}`);
  log.info(`The fight details are: ${JSON.stringify(fightDetails)}`);
  log.info('Calling OpenAI API to generate battle commentary...');

  if (BATTLE_COMMENTARY_STUB) {
    log.info('Battle commentary generation stub is enabled; returning stub file path.');
    return { battleCommentaryfilePath: '/tmp/stub-battle-commentary.txt' };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
  });

  const response = await openai.responses.create({
    model: 'o4-mini',
    input: [
      {
        role: 'developer',
        content: [
          {
            type: 'input_text',
            text: prompt,
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify(fightDetails),
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'text',
      },
    },
    reasoning: {
      effort: 'medium',
      summary: 'auto',
    },
    tools: [],
    store: false,
  });

  const battleCommentary = response.output_text;
  log.info('OpenAI API response received.');
  log.info(`Response: ${JSON.stringify(response.output_text)}`);

  const tmpDir = os.tmpdir();
  const fileName = `${gameId}-battle-commentary.txt`;
  const battleCommentaryfilePath = path.join(tmpDir, fileName);
  await fs.writeFile(battleCommentaryfilePath, battleCommentary);

  return {
    battleCommentaryfilePath,
  };
}

interface generateBattleAudioInput {
  gameId: string;
  battleCommentaryfilePath: FilePath;
}

interface generateBattleAudioOutput {
  battleAudioFileName: string;
}

export async function generateBattleAudio({
  gameId,
  battleCommentaryfilePath,
}: generateBattleAudioInput): Promise<generateBattleAudioOutput> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
  });

  const instructionsFilePath = path.resolve(__dirname, './server/ai', 'tts-announcer-instructions.txt');
  console.log('Loading instructions from:', instructionsFilePath);
  const asyncInstructions = fs.readFile(instructionsFilePath, 'utf-8');

  console.log('Loading input from:', battleCommentaryfilePath);
  const asyncInput = fs.readFile(battleCommentaryfilePath, 'utf-8');

  const [instructions, input] = await Promise.all([asyncInstructions, asyncInput]);

  const battleAudioFileName = `${gameId}-${crypto.randomUUID()}-battle-audio.mp3`;
  const battleAudiofilePath = path.resolve(GAME_ASSETS_DIR, battleAudioFileName);
  console.log('Saving audio to:', battleAudiofilePath);

  const mp3 = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'ballad',
    instructions,
    input,
    response_format: 'mp3',
    speed: 4.0,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.writeFile(battleAudiofilePath, buffer);

  return {
    battleAudioFileName,
  };
}
