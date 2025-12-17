export interface ResponseTemplate {
  scoreRange: string; // e.g., "81-100"
  gender: 'male' | 'female' | 'other';
  responses: string[];
}

export interface PersonalizedResponse {
  message: string;
  score: number;
  scoreRange: string;
}

