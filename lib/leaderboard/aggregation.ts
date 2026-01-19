import type { SmileAttempt, LeaderboardEntry } from '@/types/leaderboard';
import { groupAttemptsByIdentity } from '@/lib/leaderboard/identity';

export function aggregateLeaderboard(attempts: SmileAttempt[]): LeaderboardEntry[] {
  if (attempts.length === 0) {
    return [];
  }

  const identityGroups = groupAttemptsByIdentity(attempts);
  const entries: LeaderboardEntry[] = [];

  identityGroups.forEach(userAttempts => {
    const totalScore = userAttempts.reduce((sum, a) => sum + a.score, 0);
    const attemptCount = userAttempts.length;
    const averageScore = totalScore / attemptCount;
    const highestScore = Math.max(...userAttempts.map(a => a.score));
    const lastPlayed = Math.max(...userAttempts.map(a => a.timestamp));

    // Use the most recent attempt's user info and image
    const latestAttempt = userAttempts.sort((a, b) => b.timestamp - a.timestamp)[0];

    entries.push({
      email: latestAttempt.email,
      firstName: latestAttempt.firstName,
      lastName: latestAttempt.lastName,
      totalScore: highestScore,
      attemptCount,
      averageScore,
      highestScore,
      lastPlayed,
      rank: 0, // Will be assigned after sorting
      imageData: latestAttempt.imageData, // Use the latest image (replaces previous)
    });
  });

  // Sort by highest score descending
  entries.sort((a, b) => {
    const scoreA = Number.isFinite(a.highestScore) ? a.highestScore : a.totalScore;
    const scoreB = Number.isFinite(b.highestScore) ? b.highestScore : b.totalScore;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
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

