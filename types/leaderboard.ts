export interface SmileAttempt {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  score: number; // 0-100
  timestamp: number;
  imageData?: string; // Base64 encoded image data
  /** Backend remote ID from Pepsometer API, used for cross-device sharing */
  remoteId?: string;
}

export interface LeaderboardEntry {
  email: string;
  firstName: string;
  lastName: string;
  totalScore: number;
  attemptCount: number;
  averageScore: number;
  highestScore: number;
  lastPlayed: number;
  rank: number;
  imageData?: string; // Latest image for this user (base64)
}

