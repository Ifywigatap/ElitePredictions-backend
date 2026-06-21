import { db } from '../config/firebase.js';
import { fetchUpcomingMatches, fetchTeamStats, fetchFixtureById } from '../services/footballApiService.js';
import { generatePrediction } from '../services/aiPredictionService.js';
import { Prediction } from '../models/Prediction.js';
import { formatDate } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

// @desc    Get all predictions
// @route   GET /api/predictions
// @access  Public (VIP data masked if not authorized)
export const getPredictions = async (req, res, next) => {
  try {
    const limitAmount = parseInt(req.query.limit) || 50;
    
    // Professional NoSQL: Always order and limit your queries to prevent massive data loads
    const snapshot = await db.collection('predictions')
      .orderBy('matchDate', 'desc')
      .limit(limitAmount)
      .get();
    const predictions = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Optional: Mask VIP exclusive data if the user isn't logged in or isn't a VIP
      // (Assuming you later add middleware that populates req.user)
      if (data.isVipExclusive && (!req.user || req.user.role !== 'vip')) {
        data.prediction = 'Hidden (VIP Only)';
        data.odds = 'Locked';
      }

      predictions.push({ id: doc.id, ...data });
    });

    res.status(200).json({ success: true, data: predictions });
  } catch (error) {
    next(error);
  }
};

// Extracted generation logic so it can be called by HTTP or CRON
export const executeDailyPredictionGeneration = async () => {
  const today = new Date();
  const dateStr = formatDate(today);

  logger.info(`Starting daily prediction generation for ${dateStr}`);

  // 1. Fetch upcoming matches
  const matches = await fetchUpcomingMatches(dateStr);
  if (!matches || matches.length === 0) {
    throw new Error('No matches found for today.');
  }

    // Limit to top 5 matches for demonstration/cost-saving (Remove limit in production)
    const topMatches = matches.slice(0, 5);
    const generatedPredictions = [];

    for (const match of topMatches) {
      const homeTeam = match.teams.home.name;
      const awayTeam = match.teams.away.name;
      const homeTeamId = match.teams.home.id;
      const awayTeamId = match.teams.away.id;
      const leagueId = match.league.id;
      const season = match.league.season;
      
      let homeStats, awayStats;
      try {
        homeStats = await fetchTeamStats(homeTeamId, leagueId, season);
        awayStats = await fetchTeamStats(awayTeamId, leagueId, season);
      } catch (err) {
        logger.warn(`Failed to fetch stats for match ${match.fixture.id}, using fallback data.`);
        homeStats = { form: Math.floor(Math.random() * 40) + 50, homeAdvantage: true };
        awayStats = { form: Math.floor(Math.random() * 40) + 40 };
      }

      // 2. Generate Prediction via AI
      const aiResult = await generatePrediction(homeTeam, awayTeam, homeStats, awayStats);

      // 3. Prepare the model
      const newPrediction = new Prediction({
        id: match.fixture.id.toString(),
        homeTeam,
        awayTeam,
        league: match.league.name,
        matchDate: match.fixture.date,
        prediction: aiResult.prediction,
        odds: aiResult.odds,
        confidence: aiResult.confidence,
        analysis: aiResult.analysis,
        isVipExclusive: aiResult.confidence >= 80, // Flag as VIP if high confidence
        status: 'pending',
      });

      // 4. Save to Firestore
      await db.collection('predictions').doc(newPrediction.id).set(newPrediction.toFirestore());
      generatedPredictions.push(newPrediction);
    }

  logger.info(`Successfully generated and saved ${generatedPredictions.length} predictions.`);
  return generatedPredictions;
};

// Extracted logic to evaluate finished matches
export const executePredictionEvaluation = async () => {
  logger.info(`Starting evaluation of pending predictions...`);

  // Grab all predictions that haven't been resolved yet
  const pendingSnapshot = await db.collection('predictions').where('status', '==', 'pending').get();

  if (pendingSnapshot.empty) {
    logger.info('No pending predictions to evaluate.');
    return 0;
  }

  let evaluatedCount = 0;
  
  // Professional NoSQL: Use Batched Writes to execute multiple updates 
  // in a single, fast, and atomic network request.
  const batch = db.batch();

  for (const doc of pendingSnapshot.docs) {
    const prediction = doc.data();
    const fixtureId = prediction.id; 

    try {
      const fixtureData = await fetchFixtureById(fixtureId);
      if (!fixtureData) continue;

      const status = fixtureData.fixture.status.short;

      // Check if match is finished (FT: Full Time, AET: After Extra Time, PEN: Penalties)
      if (['FT', 'AET', 'PEN'].includes(status)) {
        const homeScore = fixtureData.goals.home;
        const awayScore = fixtureData.goals.away;

        let actualOutcome = 'X';
        if (homeScore > awayScore) actualOutcome = '1';
        else if (homeScore < awayScore) actualOutcome = '2';

        // Check if the predicted string contains the actual outcome, e.g., "(1)", "(X)", "(2)"
        const isWon = prediction.prediction.includes(`(${actualOutcome})`);
        const newStatus = isWon ? 'won' : 'lost';

        const docRef = db.collection('predictions').doc(doc.id);
        batch.update(docRef, {
          status: newStatus,
          homeScore,
          awayScore,
          updatedAt: new Date()
        });

        evaluatedCount++;
        logger.info(`Prediction ${doc.id} evaluated as ${newStatus} (${homeScore}-${awayScore})`);
      } else if (['CANC', 'PST', 'ABD'].includes(status)) {
        // Cancelled, Postponed, or Abandoned matches get voided
        const docRef = db.collection('predictions').doc(doc.id);
        batch.update(docRef, {
          status: 'void',
          updatedAt: new Date()
        });
        evaluatedCount++;
      }
    } catch (error) {
      logger.error(`Failed to evaluate prediction ${doc.id}:`, error);
    }
  }

  // Commit all the updates to the database at once
  if (evaluatedCount > 0) {
    await batch.commit();
  }

  logger.info(`Successfully evaluated ${evaluatedCount} predictions.`);
  return evaluatedCount;
};

// @desc    Generate predictions for upcoming matches
// @route   POST /api/predictions/generate
// @access  Private (Admin)
export const generateDailyPredictions = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    }

    const generatedPredictions = await executeDailyPredictionGeneration();
    res.status(200).json({ success: true, count: generatedPredictions.length, data: generatedPredictions });
  } catch (error) {
    logger.error('Failed to generate daily predictions:', error);
    next(error);
  }
};

// @desc    Get single prediction by ID
// @route   GET /api/predictions/:id
// @access  Public
export const getPredictionById = async (req, res, next) => {
  try {
    const doc = await db.collection('predictions').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Prediction not found' });
    }

    res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    next(error);
  }
};