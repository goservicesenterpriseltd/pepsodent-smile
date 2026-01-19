const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const appConfig = {
  maxAttempts: Math.max(1, parseNumber(process.env.NEXT_PUBLIC_MAX_ATTEMPTS, 2)),
  leaderboardRefreshIntervalMs: Math.max(
    250,
    parseNumber(process.env.NEXT_PUBLIC_LEADERBOARD_REFRESH_INTERVAL, 1000)
  ),
  minScore: Math.max(0, parseNumber(process.env.NEXT_PUBLIC_MIN_SCORE, 10)),
};

