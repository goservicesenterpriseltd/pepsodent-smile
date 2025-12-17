import type { SmileAttempt, LeaderboardEntry } from '@/types/leaderboard';

export function aggregateLeaderboard(attempts: SmileAttempt[]): LeaderboardEntry[] {
  if (attempts.length === 0) {
    return [];
  }

  // Group by email
  const userMap = new Map<string, SmileAttempt[]>();

  attempts.forEach(attempt => {
    if (!userMap.has(attempt.email)) {
      userMap.set(attempt.email, []);
    }
    userMap.get(attempt.email)!.push(attempt);
  });

  // Aggregate per user
  const entries: LeaderboardEntry[] = [];

  userMap.forEach((userAttempts, email) => {
    const totalScore = userAttempts.reduce((sum, a) => sum + a.score, 0);
    const attemptCount = userAttempts.length;
    const averageScore = totalScore / attemptCount;
    const highestScore = Math.max(...userAttempts.map(a => a.score));
    const lastPlayed = Math.max(...userAttempts.map(a => a.timestamp));

    // Use the most recent attempt's user info and image
    const latestAttempt = userAttempts.sort((a, b) => b.timestamp - a.timestamp)[0];

    entries.push({
      email,
      firstName: latestAttempt.firstName,
      lastName: latestAttempt.lastName,
      totalScore,
      attemptCount,
      averageScore,
      highestScore,
      lastPlayed,
      rank: 0, // Will be assigned after sorting
      imageData: latestAttempt.imageData, // Use the latest image (replaces previous)
    });
  });

  // Sort by totalScore descending
  entries.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // If tied, use highest score
    if (b.highestScore !== a.highestScore) {
      return b.highestScore - a.highestScore;
    }
    // If still tied, use most recent
    return b.lastPlayed - a.lastPlayed;
  });

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

