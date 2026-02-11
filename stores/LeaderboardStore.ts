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
import { getPlayers, type PlayerData } from '@/lib/api/pepsometer-api';

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

  /**
   * Load leaderboard from remote API using the /player endpoint
   * Requires a location_id to fetch players for that location
   */
  async loadFromRemoteAPI(locationId: number) {
    this.isLoading = true;
    this.error = null;

    try {
      console.log('Loading leaderboard from remote API for location:', locationId);
      // Show loading message for user
      toastStore.info('Loading players from remote API...');
      const response = await getPlayers(locationId);

      console.log('Players API response:', {
        status: response.status,
        hasData: !!response.data,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      });

      if (!response.status || !response.data) {
        const errorMsg = response.message || 'Failed to fetch players from API';
        console.error('Players API returned error:', errorMsg, response);
        throw new Error(errorMsg);
      }

      // Response.data is already an array of all players (pagination handled in getPlayers)
      const players: PlayerData[] = Array.isArray(response.data) 
        ? response.data 
        : [];

      if (players.length === 0) {
        runInAction(() => {
          this.leaderboard = [];
          this.lastSyncTime = Date.now();
        });
        return;
      }

      // Convert player data to leaderboard entries
      // Each player in the response should have their activities included
      const entries: LeaderboardEntry[] = players.map((player) => {
        const phone = player.phone_number || '';
        
        // Get scores from activities array if available
        let scores: number[] = [];
        if (player.activities && Array.isArray(player.activities)) {
          scores = player.activities
            .map(activity => activity.score)
            .filter((s): s is number => typeof s === 'number' && Number.isFinite(s))
            .sort((a, b) => b - a);
        }
        
        // If no activities array, try to use aggregated stats
        if (scores.length === 0 && player.activities_avg_score) {
          // If we only have average, we can't calculate total/highest properly
          // But we can use the average as a fallback
          scores = [player.activities_avg_score];
        }

        const totalScore = scores.reduce((sum, s) => sum + s, 0);
        const highestScore = scores.length > 0 ? scores[0] : 0;
        const averageScore = player.activities_avg_score 
          ? player.activities_avg_score 
          : scores.length > 0 
            ? totalScore / scores.length 
            : 0;
        const attemptCount = player.activities_count || player.activities?.length || scores.length || 0;
        
        // Get the most recent activity for image and last played time
        let imageData: string | undefined;
        let lastPlayed = player.updated_at 
          ? new Date(player.updated_at).getTime()
          : player.created_at
          ? new Date(player.created_at).getTime()
          : Date.now();

        if (player.activities && player.activities.length > 0) {
          // Sort activities by updated_at or created_at to get most recent
          const sortedActivities = [...player.activities].sort((a, b) => {
            const timeA = a.updated_at || a.created_at || '';
            const timeB = b.updated_at || b.created_at || '';
            return timeB.localeCompare(timeA);
          });
          
          const latestActivity = sortedActivities[0];
          lastPlayed = latestActivity.updated_at 
            ? new Date(latestActivity.updated_at).getTime()
            : latestActivity.created_at
            ? new Date(latestActivity.created_at).getTime()
            : lastPlayed;
          
          // Try to get image from latest activity
          // Store image_url as-is (it's a URL string, not base64)
          // The component will need to handle URL vs base64
          if (latestActivity.image_url) {
            // Prefix with a marker to indicate it's a URL, not base64
            // Format: "url:https://..."
            imageData = `url:${latestActivity.image_url}`;
          }
        }

        // Also check player-level image
        if (!imageData && player.image_base64) {
          // Remove data URL prefix if present
          imageData = player.image_base64.replace(/^data:image\/[^;]+;base64,/, '');
        }
        
        if (!imageData && player.image_url) {
          // Player-level image URL
          imageData = `url:${player.image_url}`;
        }

        return {
          email: phone, // Use phone as identifier since we don't have email
          firstName: player.first_name || '',
          lastName: player.last_name || '',
          totalScore,
          attemptCount,
          averageScore,
          highestScore,
          lastPlayed,
          rank: 0, // Will be set after sorting
          imageData,
        };
      });

      // Sort by highest score, then by last played
      const sorted = entries.sort((a, b) => {
        if (b.highestScore !== a.highestScore) {
          return b.highestScore - a.highestScore;
        }
        return b.lastPlayed - a.lastPlayed;
      });

      // Assign ranks
      runInAction(() => {
        this.leaderboard = sorted.map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
        this.lastSyncTime = Date.now();
      });
    } catch (error) {
      let errorMessage = 'Failed to load leaderboard from remote API';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        // If it's a PepsometerApiError, include more details
        if ('status' in error && 'body' in error) {
          const apiError = error as { status: number; body: unknown; message: string };
          console.error('Pepsometer API Error:', {
            status: apiError.status,
            message: apiError.message,
            body: apiError.body,
          });
          
          // Try to extract a more helpful error message
          if (apiError.body && typeof apiError.body === 'object') {
            const body = apiError.body as Record<string, unknown>;
            if (body.message) {
              errorMessage = String(body.message);
            } else if (body.error) {
              errorMessage = String(body.error);
            }
          }
        }
      }
      
      this.error = errorMessage;
      console.error('Error loading leaderboard from remote API:', error);
      toastStore.error(`Remote API Error: ${errorMessage}. Please try again or switch to local storage.`);
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

