import { makeAutoObservable, runInAction } from 'mobx';
import type { SmileAttempt, LeaderboardEntry } from '@/types/leaderboard';
import { saveAttempt, getAllAttempts } from '@/lib/persistence/indexeddb';
import { aggregateLeaderboard } from '@/lib/leaderboard/aggregation';
import { 
  fetchLeaderboardFromAPI, 
  submitAttemptToAPI, 
  isBackendAPIAvailable 
} from '@/lib/api/leaderboard-api';

class LeaderboardStore {
  attempts: SmileAttempt[] = [];
  leaderboard: LeaderboardEntry[] = [];
  isLoading = false;
  error: string | null = null;
  lastSyncTime: number | null = null;

  constructor() {
    makeAutoObservable(this);
    // Don't load from storage in constructor to avoid hydration issues
    // Data will be loaded in useEffect on client side
  }

  async addAttempt(attempt: SmileAttempt) {
    try {
      // Save to local storage first
      await saveAttempt(attempt);
      
      // Try to sync to backend API if available
      if (isBackendAPIAvailable()) {
        try {
          await submitAttemptToAPI({
            email: attempt.email,
            firstName: attempt.firstName,
            lastName: attempt.lastName,
            phone: attempt.phone,
            gender: attempt.gender,
            score: attempt.score,
            timestamp: attempt.timestamp,
          });
          console.log('Attempt synced to backend API');
        } catch (apiError) {
          console.warn('Failed to sync attempt to backend, keeping local only:', apiError);
          // Continue with local storage even if API fails
        }
      }
      
      await this.loadFromStorage();
      this.updateLeaderboard();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to save attempt';
      console.error('Error adding attempt:', error);
    }
  }

  async loadFromStorage() {
    this.isLoading = true;
    this.error = null;

    try {
      // Try to load from backend API first if available
      if (isBackendAPIAvailable()) {
        try {
          const apiLeaderboard = await fetchLeaderboardFromAPI();
          runInAction(() => {
            // Use API data directly (it's already aggregated)
            this.leaderboard = apiLeaderboard;
            this.lastSyncTime = Date.now();
          });
          return; // Successfully loaded from API
        } catch (apiError) {
          console.warn('Failed to load from backend API, falling back to local storage:', apiError);
          // Fall through to local storage
        }
      }

      // Fallback to local storage
      const attempts = await getAllAttempts();
      runInAction(() => {
        this.attempts = attempts;
        this.updateLeaderboard();
        this.lastSyncTime = Date.now();
      });
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to load leaderboard';
      console.error('Error loading leaderboard:', error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  private updateLeaderboard() {
    this.leaderboard = aggregateLeaderboard(this.attempts);
  }

  getRankByEmail(email: string): number {
    const entry = this.leaderboard.find(e => e.email === email);
    return entry?.rank || 0;
  }

  getUserHistory(email: string): SmileAttempt[] {
    return this.attempts
      .filter(a => a.email === email)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getTopN(n: number): LeaderboardEntry[] {
    return this.leaderboard.slice(0, n);
  }

  clearLeaderboard() {
    this.attempts = [];
    this.leaderboard = [];
  }
}

export const leaderboardStore = new LeaderboardStore();

