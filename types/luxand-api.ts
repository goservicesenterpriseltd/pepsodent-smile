export interface LuxandEmotion {
  angry: number;
  disgust: number;
  fear: number;
  happy: number;
  neutral: number;
  sad: number;
  surprise: number;
}

export interface LuxandFaceRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LuxandFace {
  dominant_emotion: string;
  emotion: LuxandEmotion;
  region: LuxandFaceRegion;
}

export interface LuxandEmotionResponse {
  status: 'success' | 'error';
  faces: LuxandFace[];
}

export interface SmileScoreResult {
  score: number; // 0-100 (from emotion.happy)
  dominantEmotion: string;
  allEmotions: LuxandEmotion;
  primaryFaceIndex: number;
  confidence: number;
}

