import openai from '../config/openai.js';
import { env } from '../config/env.js';
import { getLatestScores } from '../liveScoreStore.js';
import { logger } from '../utils/logger.js';

export const getAIInsights = async (req, res) => {
  if (!openai) {
    return res.status(503).json({ success: false, message: 'AI Insights service is disabled or not configured.' });
  }

  try {
    const scores = getLatestScores();
    
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an elite football (soccer) betting analyst. Analyze current match data and provide trending picks, tactical insights, and live momentum alerts. Your output must be strictly valid JSON."
        },
        {
          role: "user",
          content: `Data: ${JSON.stringify(scores)}. Generate insights including trendingPicks (array), deepInsights (array), and liveAlerts (array).`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    logger.error('OpenAI Insights Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI insights'
    });
  }
};