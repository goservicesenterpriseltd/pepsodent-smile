import type { LeaderboardEntry, SmileAttempt } from '@/types/leaderboard';
import {
  fetchLeaderboardFromAPI,
  isBackendAPIAvailable,
  submitAttemptToAPI
} from '@/lib/api/leaderboard-api';
import { getAllAttempts, saveAttempt } from '@/lib/persistence/indexeddb';
import { makeAutoObservable, runInAction } from 'mobx';

import type { UserData } from '@/types/user';
import { aggregateLeaderboard } from '@/lib/leaderboard/aggregation';
import { appConfig } from '@/lib/config/app-config';
import { getAttemptsForIdentity } from '@/lib/leaderboard/identity';
import { toastStore } from './ToastStore';

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
      const existingAttempts = await getAllAttempts();
      const userAttempts = getAttemptsForIdentity(existingAttempts, attempt);
      if (userAttempts.length >= appConfig.maxAttempts) {
        this.error = 'Maximum attempts reached';
        toastStore.warning('You have reached the maximum number of attempts. Your best score will be used!');
        return false;
      }

      console.log('Attempt to add:', attempt);

      // Save to local storage first
      await saveAttempt(attempt);
      
      // Immediately update local attempts array so count is accurate
      const updatedAttempts = await getAllAttempts();
      runInAction(() => {
        this.attempts = updatedAttempts;
        this.updateLeaderboard();
      });

      console.log('got here')
      
      // Try to sync to backend API if available (async, don't wait)
      if (isBackendAPIAvailable()) {
        // Don't await - sync in background
        submitAttemptToAPI({
          email: attempt.email,
          firstName: attempt.firstName,
          lastName: attempt.lastName,
          phone: attempt.phone,
          gender: attempt.gender,
          score: attempt.score,
          timestamp: attempt.timestamp,
        }).then((response) => {
          console.log('Attempt synced to backend API', response);
          console.log('Attempt synced to backend API');
        }).catch((apiError) => {
          console.warn('Failed to sync attempt to backend, keeping local only:', apiError);
          const errorMsg = apiError instanceof Error ? apiError.message : 'Failed to sync to server';
          toastStore.warning(`Score saved locally. ${errorMsg}`);
        });
      }
      
      // Reload from storage to ensure consistency (but don't wait for API sync)
      // This ensures local attempts are always up to date
      const finalAttempts = await getAllAttempts();
      runInAction(() => {
        this.attempts = finalAttempts;
        this.updateLeaderboard();
      });
      
      return true;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to save attempt';
      console.error('Error adding attempt:', error);
      toastStore.error(this.error);
      return false;
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
            // Normalize API data to be sorted and ranked by best score
            const sorted = [...apiLeaderboard].sort((a, b) => {
              const scoreA = Number.isFinite(a.highestScore) ? a.highestScore : a.totalScore;
              const scoreB = Number.isFinite(b.highestScore) ? b.highestScore : b.totalScore;
              if (scoreB !== scoreA) {
                return scoreB - scoreA;
              }
              return b.lastPlayed - a.lastPlayed;
            });
            this.leaderboard = sorted.map((entry, index) => ({
              ...entry,
              rank: index + 1,
            }));
            this.lastSyncTime = Date.now();
          });
          return; // Successfully loaded from API
        } catch (apiError) {
          console.warn('Failed to load from backend API, falling back to local storage:', apiError);
          const errorMsg = apiError instanceof Error ? apiError.message : 'Failed to load from server';
          toastStore.warning(`Using local scores. ${errorMsg}`);
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
      toastStore.error(this.error);
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

  getUserHistory(identity: UserData): SmileAttempt[] {
    return getAttemptsForIdentity(this.attempts, identity).sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }

  getAttemptCount(identity: UserData): number {
    // Use current attempts from store, but if empty, try to get from storage
    // This ensures we have the latest data after an attempt is saved
    if (this.attempts.length === 0) {
      // If attempts array is empty, the count is 0
      return 0;
    }
    return getAttemptsForIdentity(this.attempts, identity).length;
  }

  async getAttemptCountAsync(identity: UserData): Promise<number> {
    // Always get fresh data from storage to ensure accuracy
    const attempts = await getAllAttempts();
    return getAttemptsForIdentity(attempts, identity).length;
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

