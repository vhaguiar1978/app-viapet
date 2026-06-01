export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function daysFromNow(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const DEMO_BOOKMAKERS = ["BetMGM", "DraftKings", "FanDuel", "Caesars", "Pinnacle", "Bet365"];
