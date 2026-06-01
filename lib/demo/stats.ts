import type {
  AwayAtHostRecord,
  EnrichedStats,
  FixtureLineup,
  HalfBreakdown,
  HeadToHeadFixture,
  RecentFixturesAggregate,
  TeamSeasonStats
} from "../providers/stats";

function rng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = (h ^ seed.charCodeAt(i)) * 16777619;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return (h & 0xffffffff) / 0xffffffff;
  };
}

function half(total: number, firstHalfShare: number): HalfBreakdown {
  const firstHalf = Math.round(total * firstHalfShare);
  const secondHalf = Math.round(total * (1 - firstHalfShare));
  return {
    firstHalf,
    secondHalf,
    extraTime: 0,
    firstHalfPct: firstHalfShare,
    secondHalfPct: 1 - firstHalfShare
  };
}

function teamStats(name: string, leagueName: string, seed: string): TeamSeasonStats {
  const r = rng(seed);
  const played = 24 + Math.floor(r() * 8);
  const wins = Math.floor(played * (0.35 + r() * 0.3));
  const losses = Math.floor(played * (0.15 + r() * 0.2));
  const draws = played - wins - losses;
  const goalsScored = Math.floor(played * (1.3 + r() * 1.0));
  const goalsConceded = Math.floor(played * (0.7 + r() * 0.9));
  const firstHalfShare = 0.4 + r() * 0.15;
  const formArr = Array.from({ length: 10 }, () => {
    const v = r();
    return v < 0.5 ? "W" : v < 0.75 ? "D" : "L";
  });
  return {
    team: { id: Math.abs(seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0)), name, logo: `https://media.api-sports.io/football/teams/${Math.floor(r() * 1000)}.png` },
    league: { id: 999, name: leagueName, season: 2026 },
    form: formArr.join(""),
    played,
    wins,
    draws,
    losses,
    goalsScored,
    goalsConceded,
    avgGoalsScored: parseFloat((goalsScored / played).toFixed(2)),
    avgGoalsConceded: parseFloat((goalsConceded / played).toFixed(2)),
    cleanSheets: Math.floor(played * (0.2 + r() * 0.2)),
    failedToScore: Math.floor(played * (0.1 + r() * 0.15)),
    yellowCardsPerGame: parseFloat((1.8 + r() * 1.0).toFixed(2)),
    redCardsPerGame: parseFloat((0.05 + r() * 0.1).toFixed(3)),
    preferredFormation: ["4-3-3", "4-2-3-1", "3-5-2", "4-4-2"][Math.floor(r() * 4)],
    goalsByMinute: [
      { window: "0-15", count: Math.round(goalsScored * 0.13), pct: 13 },
      { window: "16-30", count: Math.round(goalsScored * 0.15), pct: 15 },
      { window: "31-45", count: Math.round(goalsScored * 0.18), pct: 18 },
      { window: "46-60", count: Math.round(goalsScored * 0.18), pct: 18 },
      { window: "61-75", count: Math.round(goalsScored * 0.17), pct: 17 },
      { window: "76-90", count: Math.round(goalsScored * 0.19), pct: 19 }
    ],
    goalsScoredByHalf: half(goalsScored, firstHalfShare),
    goalsConcededByHalf: half(goalsConceded, 0.4 + r() * 0.15),
    yellowCardsByHalf: half(Math.round((1.8 + r() * 1.0) * played), 0.35 + r() * 0.1)
  };
}

function lineup(teamName: string, teamId: number, seed: string): FixtureLineup {
  const r = rng(seed);
  const positions = ["G", "D", "D", "D", "D", "M", "M", "M", "F", "F", "F"];
  const subPositions = ["G", "D", "M", "M", "F", "F", "D"];
  return {
    team: { id: teamId, name: teamName, logo: `https://media.api-sports.io/football/teams/${teamId}.png` },
    formation: ["4-3-3", "4-2-3-1", "3-5-2"][Math.floor(r() * 3)],
    coach: { name: ["Tite", "Pep Guardiola", "Jürgen Klopp", "Diego Simeone", "Carlo Ancelotti"][Math.floor(r() * 5)], photo: "" },
    startXI: positions.map((pos, i) => ({
      id: 1000 + i,
      name: `Atleta ${i + 1}`,
      number: i + 1,
      pos
    })),
    substitutes: subPositions.map((pos, i) => ({
      id: 2000 + i,
      name: `Reserva ${i + 1}`,
      number: 12 + i,
      pos
    }))
  };
}

function recentAgg(seed: string, firstHalfPct: number): RecentFixturesAggregate {
  const r = rng(seed);
  const avgShotsOnGoal = 4.2 + r() * 2.6;
  const avgShotsTotal = avgShotsOnGoal * (2.2 + r() * 0.6);
  const avgCorners = 4.5 + r() * 2.8;
  return {
    sampleSize: 5,
    avgShotsOnGoal: parseFloat(avgShotsOnGoal.toFixed(1)),
    avgShotsTotal: parseFloat(avgShotsTotal.toFixed(1)),
    avgCorners: parseFloat(avgCorners.toFixed(1)),
    estShotsFirstHalf: parseFloat((avgShotsOnGoal * firstHalfPct).toFixed(1)),
    estShotsSecondHalf: parseFloat((avgShotsOnGoal * (1 - firstHalfPct)).toFixed(1)),
    estCornersFirstHalf: parseFloat((avgCorners * firstHalfPct).toFixed(1)),
    estCornersSecondHalf: parseFloat((avgCorners * (1 - firstHalfPct)).toFixed(1)),
    note: "[DEMO] Médias do jogo todo. Divisão por tempo estimada pela distribuição de gols."
  };
}

function h2hList(hostName: string, visitorName: string, league: string, seed: string): HeadToHeadFixture[] {
  const r = rng(seed);
  const fixtures: HeadToHeadFixture[] = [];
  for (let i = 0; i < 6; i++) {
    const monthsAgo = (i + 1) * 4;
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    const hostHome = i % 2 === 0;
    const hg = Math.floor(r() * 4);
    const ag = Math.floor(r() * 3);
    fixtures.push({
      date: d.toISOString(),
      league,
      homeName: hostHome ? hostName : visitorName,
      awayName: hostHome ? visitorName : hostName,
      homeGoals: hostHome ? hg : ag,
      awayGoals: hostHome ? ag : hg
    });
  }
  return fixtures;
}

function awayRecord(hostName: string, visitorName: string, seed: string): AwayAtHostRecord {
  const r = rng(seed);
  const played = 5;
  const visitorWins = Math.floor(r() * 2);
  const draws = Math.floor(r() * 2);
  const hostWins = played - visitorWins - draws;
  return {
    totalConfrontations: 10,
    awayPlayedAsAwayAtHost: played,
    awayWinsAtHost: visitorWins,
    awayDrawsAtHost: draws,
    awayLossesAtHost: hostWins,
    awayGoalsScoredAtHost: Math.floor(played * (0.6 + r() * 0.8)),
    awayGoalsConcededAtHost: Math.floor(played * (1.0 + r() * 0.8)),
    hostWinsAtHome: hostWins,
    lastVisitorWinAtHost: visitorWins > 0
      ? { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(), score: `${Math.floor(r() * 3)}-${Math.floor(r() * 2) + 1}` }
      : null
  };
}

export function demoEnrichedStats(home: string, away: string, leagueName: string): EnrichedStats {
  const homeStats = teamStats(home, leagueName, `H:${home}`);
  const awayStats = teamStats(away, leagueName, `A:${away}`);
  return {
    fixture: {
      fixtureId: 999000 + Math.abs((home + away).length),
      leagueId: 999,
      season: 2026,
      homeTeam: homeStats.team,
      awayTeam: awayStats.team
    },
    home: homeStats,
    away: awayStats,
    lineups: [
      lineup(home, homeStats.team.id, `L:${home}`),
      lineup(away, awayStats.team.id, `L:${away}`)
    ],
    h2h: h2hList(home, away, leagueName, `H2H:${home}:${away}`),
    awayRecord: awayRecord(home, away, `AR:${home}:${away}`),
    homeRecent: recentAgg(`R:${home}`, homeStats.goalsScoredByHalf.firstHalfPct),
    awayRecent: recentAgg(`R:${away}`, awayStats.goalsScoredByHalf.firstHalfPct)
  };
}
