import OpenAI from 'openai';
import { env } from './env.js';

const openai = env.OPENAI_ENABLED 
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

export default openai;