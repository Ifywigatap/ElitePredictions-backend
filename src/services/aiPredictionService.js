// Service to handle AI generation for match predictions
import OpenAI from 'openai';
import { z } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Define the exact shape and types expected from the AI
const aiResponseSchema = z.object({
  prediction: z.string(),
  odds: z.string(),
  // coerce.number() is a great safety net in case the AI returns {"confidence": "82"} instead of 82
  confidence: z.coerce.number().min(0).max(100), 
  analysis: z.string(),
});

let openai;
if (env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

export const generatePrediction = async (homeTeam, awayTeam, homeStats, awayStats) => {
  // If we have an API key, run real AI predictions!
  if (openai) {
    try {
      const prompt = `Analyze the upcoming football match between ${homeTeam} and ${awayTeam}. 
      Home Stats: ${JSON.stringify(homeStats)}
      Away Stats: ${JSON.stringify(awayStats)}
      
      Based on these statistics, provide a prediction, the most likely odds format (e.g., '1.85'), a confidence percentage (e.g., 82), and a brief 2-sentence analysis explaining your reasoning.
      Return ONLY a valid JSON object with exactly these keys: "prediction" (string), "odds" (string), "confidence" (number), "analysis" (string).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // gpt-4o or gpt-4o-mini are recommended for speed and lower costs
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      // Parse the JSON string from OpenAI
      const rawJson = JSON.parse(response.choices[0].message.content);
      
      // Validate and strip out any unexpected fields using Zod
      const validatedResult = aiResponseSchema.parse(rawJson);
      
      logger.info(`Successfully generated AI prediction for ${homeTeam} vs ${awayTeam}`);
      
      return validatedResult;
    } catch (error) {
      logger.error('OpenAI prediction generation failed, falling back to heuristic:', error);
    }
  }
  
  // --- Simulated AI logic (Fallback) ---
  // This uses a simple heuristic based on mocked form scores to return realistic data
  const homeAdvantage = 10;
  const homeScore = (homeStats?.form || 50) + homeAdvantage;
  const awayScore = awayStats?.form || 50;
  
  let prediction = 'Draw (X)';
  let odds = '3.20';
  let confidence = 55;
  let analysis = `${homeTeam} and ${awayTeam} are evenly matched based on recent form. A tight, tactical draw is the most probable outcome.`;

  if (homeScore > awayScore + 15) {
    prediction = `Home Win (1) - ${homeTeam}`;
    odds = '1.85';
    confidence = 82;
    analysis = `${homeTeam} has a distinct advantage playing at home with superior form. Expect them to control the game and secure the victory.`;
  } else if (awayScore > homeScore + 10) {
    prediction = `Away Win (2) - ${awayTeam}`;
    odds = '2.10';
    confidence = 75;
    analysis = `${awayTeam} comes into this fixture in much better shape than the hosts. Their attacking momentum should be enough to take all three points.`;
  }

  return {
    prediction,
    odds,
    confidence,
    analysis,
  };
};