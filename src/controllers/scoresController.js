import { getLatestScores } from '../liveScoreStore.js';

// @desc    Get live match scores
// @route   GET /api/scores/live
// @access  Public
export const getLiveScores = async (req, res, next) => {
  try {
    let scores = getLatestScores();

    // Fallback Simulated Data if the in-memory store is empty 
    // (e.g., API key is missing or the external API failed)
    if (!scores || scores.length === 0) {
      scores = [
      {
        league: 'Premier League',
        country: 'England',
        matches: [
          { id: 101, homeTeam: 'Arsenal', homeLogo: 'https://media.api-sports.io/football/teams/42.png', awayTeam: 'Chelsea', awayLogo: 'https://media.api-sports.io/football/teams/49.png', homeScore: 2, awayScore: 1, status: 'live', time: "74'", hasAnalysis: true },
          { id: 105, homeTeam: 'Man United', homeLogo: 'https://media.api-sports.io/football/teams/33.png', awayTeam: 'Spurs', awayLogo: 'https://media.api-sports.io/football/teams/47.png', homeScore: null, awayScore: null, status: 'scheduled', time: "20:00", hasAnalysis: true },
        ]
      },
      {
        league: 'Champions League',
        country: 'Europe',
        matches: [
          { id: 104, homeTeam: 'B. Munich', homeLogo: 'https://media.api-sports.io/football/teams/157.png', awayTeam: 'PSG', awayLogo: 'https://media.api-sports.io/football/teams/85.png', homeScore: 0, awayScore: 0, status: 'live', time: "12'", hasAnalysis: true },
        ]
      }
      ];
    }

    // Send data back to the React frontend
    res.status(200).json(scores);
    
  } catch (error) {
    next(error);
  }
};