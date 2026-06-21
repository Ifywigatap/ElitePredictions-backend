// In-memory store for the latest live scores
let latestScores = [];

export const setLatestScores = (data) => {
  latestScores = data;
};

export const getLatestScores = () => latestScores;