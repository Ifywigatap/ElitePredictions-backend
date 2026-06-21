import axios from 'axios';
import { env } from '../config/env.js';
import redisClient from '../config/redis.js';
import { logger } from '../utils/logger.js';

const apiClient = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': env.FOOTBALL_API_KEY,
    'Content-Type': 'application/json',
  },
});

// Helper to group and format raw API-Football fixtures into the UI's layout
const formatLiveScores = (rawFixtures) => {
  const grouped = {};

  rawFixtures.forEach((item) => {
    const leagueName = item.league.name;
    const countryName = item.league.country;
    const groupKey = `${countryName}-${leagueName}`;

    if (!grouped[groupKey]) {
      grouped[groupKey] = { league: leagueName, country: countryName, matches: [] };
    }

    // Map API-Football short status to UI status
    const shortStatus = item.fixture.status.short;
    let mappedStatus = 'scheduled';
    if (['1H', '2H', 'ET', 'P', 'LIVE'].includes(shortStatus)) mappedStatus = 'live';
    else if (shortStatus === 'HT') mappedStatus = 'ht';
    else if (['FT', 'AET', 'PEN'].includes(shortStatus)) mappedStatus = 'finished';
    else if (['CANC', 'PST', 'ABD'].includes(shortStatus)) mappedStatus = 'void';

    // Determine what to show in the time bubble (e.g., "74'", "HT", or "15:30")
    let displayTime = item.fixture.status.elapsed ? `${item.fixture.status.elapsed}'` : shortStatus;
    if (mappedStatus === 'scheduled') {
      const date = new Date(item.fixture.date);
      displayTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    grouped[groupKey].matches.push({
      id: item.fixture.id,
      homeTeam: item.teams.home.name,
      homeLogo: item.teams.home.logo,
      awayTeam: item.teams.away.name,
      awayLogo: item.teams.away.logo,
      homeScore: item.goals.home,
      awayScore: item.goals.away,
      status: mappedStatus,
      time: displayTime,
      hasAnalysis: false, // Optional: You can connect this to Firestore later!
    });
  });

  return Object.values(grouped);
};

export const fetchLiveScores = async () => {
  try {
    const cacheKey = 'api-football:live-scores';
    
    // 1. Check Redis Cache First (if connected)
    if (redisClient.isOpen) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    // 2. Fetch from API-Football
    const response = await apiClient.get('/fixtures', { params: { live: 'all' } });
    const formattedData = formatLiveScores(response.data.response || []);
    
    // 3. Save to Redis (if connected)
    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(formattedData));
    }

    return formattedData;
  } catch (error) {
    logger.error('Error fetching live scores from API-Football:', error);
    throw error;
  }
};

export const fetchUpcomingMatches = async (date) => {
  try {
    const cacheKey = `api-football:upcoming:${date}`;
    
    if (redisClient.isOpen) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }

    const response = await apiClient.get('/fixtures', { params: { date } });
    const data = response.data.response;

    if (redisClient.isOpen) {
      // Cache for 12 hours (43200 seconds) since upcoming matches don't change by the minute
      await redisClient.setEx(cacheKey, 43200, JSON.stringify(data));
    }

    return data;
  } catch (error) {
    logger.error('Error fetching upcoming matches:', error);
    throw error;
  }
};

export const fetchTeamStats = async (teamId, leagueId, season) => {
  try {
    const cacheKey = `api-football:stats:${teamId}:${leagueId}:${season}`;
    
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const response = await apiClient.get('/teams/statistics', { params: { team: teamId, league: leagueId, season } });
    const rawData = response.data.response;

    // Safely trim down the massive response object to only the most important stats.
    // This saves heavily on OpenAI token costs!
    const data = rawData ? {
      form: rawData.form,           // e.g., "WDLWW"
      fixtures: rawData.fixtures,   // Win/Draw/Loss totals
      goals: rawData.goals,         // Goals For/Against averages
    } : { form: 'N/A', note: 'No data available for this season yet.' };

    // Cache for 24 hours (86400 seconds) since historical stats don't change by the minute
    await redisClient.setEx(cacheKey, 86400, JSON.stringify(data));

    return data;
  } catch (error) {
    logger.error(`Error fetching stats for team ${teamId}:`, error);
    throw error;
  }
};

export const fetchFixtureById = async (fixtureId) => {
  try {
    const cacheKey = `api-football:fixture:${fixtureId}`;
    
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const response = await apiClient.get('/fixtures', { params: { id: fixtureId } });
    const data = response.data.response[0]; // Get the specific match

    // If the match is over (FT, AET, PEN), cache it for a whole week (604800 seconds)
    if (['FT', 'AET', 'PEN'].includes(data?.fixture?.status?.short)) {
      await redisClient.setEx(cacheKey, 604800, JSON.stringify(data));
    }

    return data;
  } catch (error) {
    logger.error(`Error fetching fixture ${fixtureId}:`, error);
    throw error;
  }
};