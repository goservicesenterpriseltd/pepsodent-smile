import type { LeaderboardEntry } from '@/types/leaderboard';

// Backend API configuration
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
const USE_BACKEND_API = process.env.NEXT_PUBLIC_USE_BACKEND_API === 'true';

/**
 * Fetch leaderboard from backend API
 */
export async function fetchLeaderboardFromAPI(): Promise<LeaderboardEntry[]> {
  if (!USE_BACKEND_API || !BACKEND_API_URL) {
    throw new Error('Backend API is not configured');
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/leaderboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for fresh data
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.leaderboard || data || [];
  } catch (error) {
    console.error('Error fetching leaderboard from API:', error);
    throw error;
  }
}

/**
 * Submit attempt to backend API
 */
export async function submitAttemptToAPI(attempt: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  score: number;
  timestamp: number;
}): Promise<void> {
  if (!USE_BACKEND_API || !BACKEND_API_URL) {
    throw new Error('Backend API is not configured');
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attempt),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error submitting attempt to API:', error);
    throw error;
  }
}

/**
 * Check if backend API is available
 */
export function isBackendAPIAvailable(): boolean {
  return USE_BACKEND_API && !!BACKEND_API_URL;
}

