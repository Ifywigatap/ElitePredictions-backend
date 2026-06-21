export class Prediction {
  constructor({ 
    id, 
    homeTeam, 
    awayTeam, 
    league, 
    matchDate, 
    prediction, 
    odds, 
    confidence, 
    analysis = '',
    isVipExclusive = false, 
    status = 'pending', // 'pending', 'won', 'lost', 'void'
    createdAt = new Date() 
  }) {
    this.id = id;
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.league = league;
    this.matchDate = matchDate;
    this.prediction = prediction;
    this.odds = odds;
    this.confidence = confidence;
    this.analysis = analysis;
    this.isVipExclusive = isVipExclusive;
    this.status = status;
    this.createdAt = createdAt;
  }

  toFirestore() {
    return {
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      league: this.league,
      matchDate: this.matchDate,
      prediction: this.prediction,
      odds: this.odds,
      confidence: this.confidence,
      analysis: this.analysis,
      isVipExclusive: this.isVipExclusive,
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}