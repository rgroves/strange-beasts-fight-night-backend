import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

config();

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in the environment variables.');
  process.exit(1);
}

if (!process.env.OPENAI_ORG_ID) {
  console.error('OPENAI_ORG_ID is not set in the environment variables.');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

const instructionsFilePath = path.resolve(__dirname, '../ai', 'tts-announcer-instructions.txt');
console.log('Loading instructions from:', instructionsFilePath);
const instructions = fs.readFileSync(instructionsFilePath, 'utf-8');

const inputFilePath = path.resolve(__dirname, '../ai', 'mock-battle.txt');
console.log('Loading input from:', inputFilePath);
const input = fs.readFileSync(inputFilePath, 'utf-8');

const speechFile = path.resolve('./speech.mp3');
console.log('Saving speech to:', speechFile);

async function main() {
  const mp3 = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'ballad',
    instructions,
    input,
    response_format: 'mp3',
    speed: 4.0,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
