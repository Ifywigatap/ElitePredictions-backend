import { fetchLiveScores } from './services/footballApiService.js';
import { setLatestScores, getLatestScores } from './liveScoreStore.js'; // Fixed path and added missing import
import { logger } from './utils/logger.js';

// Define the polling interval (e.g., every 10 seconds for live data)
const POLLING_INTERVAL = 10000; // 10 seconds

export const startLiveScoreEmitter = (io) => {
  // Function to fetch and emit scores
  const updateAndEmitScores = async () => {
    try {
      const scores = await fetchLiveScores();
      setLatestScores(scores); // Update the in-memory store

      // Emit the updated scores to all connected WebSocket clients
      io.emit('live-score-update', scores);
      logger.debug('Emitted live score update via WebSocket');
    } catch (error) {
      logger.error('Failed to fetch and emit live scores:', error);
    }
  };

  // Start a listener for new Socket.io connections
  io.on('connection', (socket) => {
    logger.info(`New WebSocket client connected: ${socket.id}`);
    // Optionally, send the current scores immediately to new connections
    socket.emit('live-score-update', getLatestScores());

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  // Fetch and emit immediately on server start
  updateAndEmitScores();
  // Set up polling for continuous updates
  setInterval(updateAndEmitScores, POLLING_INTERVAL);
  logger.info(`Live score emitter started, polling every ${POLLING_INTERVAL / 1000} seconds.`);
};