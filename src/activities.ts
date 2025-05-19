import { log } from '@temporalio/activity';
import crypto from 'crypto';
import { config } from 'dotenv';
import fs from 'fs/promises';
import OpenAI, { toFile } from 'openai';
import os from 'os';
import path from 'path';
import generateMockBattle from './battle-logic';
import { FilePath, GameId, MonsterConfig, PlayerId } from './types';

config();

interface generateMonsterImageInput {
  doodleFilePath: string;
  prompt: string;
  style: string;
}

interface generateMonsterImageOutput {
  filePath: FilePath;
}

export async function generateMonsterImage(input: generateMonsterImageInput): Promise<generateMonsterImageOutput> {
  log.info(`Generating monster image with doodle file: ${JSON.stringify(input)}`);
  const { doodleFilePath, prompt, style } = input;

  const doodleFileContent = await fs.readFile(doodleFilePath);
  const doodleFile = await toFile(doodleFileContent, 'doodle.png', { type: 'image/png' });

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

  if (!response.data || response.data.length === 0) {
    throw new Error('No image data returned from OpenAI API');
  }

  const b64ImageData = response.data[0].b64_json as string;
  const imgBuffer = Buffer.from(b64ImageData, 'base64');

  const tmpDir = os.tmpdir();
  const fileName = `openai-image-${crypto.randomUUID()}-${doodleFilePath.split('/').pop()}`;
  const filePath = path.join(tmpDir, fileName);

  log.info(`Saving image to '${filePath}'...`);
  await fs.writeFile(filePath, imgBuffer);
  log.info('Image saved successfully.');

  return { filePath };
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
