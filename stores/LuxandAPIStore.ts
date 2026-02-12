import type { LuxandEmotionResponse, SmileScoreResult } from '@/types/luxand-api';

import type { FaceDetectionResult } from '@/lib/detection/face-detector';
import { appConfig } from '@/lib/config/app-config';
import { calculateSmileScore } from '@/lib/api/luxand';
import { makeAutoObservable } from 'mobx';
import { toastStore } from './ToastStore';
import { uploadImageToLuxand } from '@/lib/api/luxand';

class LuxandAPIStore {
  apiResponse: LuxandEmotionResponse | null = null;
  smileScore: SmileScoreResult | null = null;
  isLoading = false;
  error: string | null = null;
  // When true, we bypass Luxand API and derive a score from our own face detector data.
  useInternalScoring = false;

  constructor() {
    makeAutoObservable(this);
  }

  setUseInternalScoring(value: boolean) {
    this.useInternalScoring = value;
  }

  toggleScoringMode() {
    this.useInternalScoring = !this.useInternalScoring;
  }

  async analyzeImage(imageFile: File) {
    this.isLoading = true;
    this.error = null;

    try {
      // Validate file
      if (!imageFile || imageFile.size === 0) {
        throw new Error('Invalid image file. Please try capturing again.');
      }

      if (this.useInternalScoring) {
        // In internal scoring mode, the actual score is computed elsewhere from
        // our own detection data. We should never reach this branch in normal
        // flow, but keep a defensive guard.
        throw new Error('Internal scoring is enabled – Luxand analysis should be skipped.');
      }

      const response = await uploadImageToLuxand(imageFile);
      this.apiResponse = response;
      const rawScore = calculateSmileScore(response);
      if (rawScore) {
        this.smileScore = {
          ...rawScore,
          score: Math.max(appConfig.minScore, rawScore.score),
        };
      } else {
        this.smileScore = null;
      }

      if (!this.smileScore) {
        // Provide more helpful error message
        const hasFaces = response.faces && response.faces.length > 0;
        if (!hasFaces) {
          throw new Error('No face detected in the image. Please make sure your face is clearly visible in the frame and try again.');
        } else {
          throw new Error('Unable to calculate smile score. Please try capturing again.');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to analyze image. Please try again.';
      
      this.error = errorMessage;
      console.error('Error analyzing image:', error);
      
      // Show error in toast
      toastStore.error(errorMessage);
      
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  get hasValidScore(): boolean {
    return this.smileScore !== null && this.smileScore.score >= 0;
  }

  get primaryEmotion(): string {
    return this.smileScore?.dominantEmotion || '';
  }

  /**
   * Use our own face detection data to synthesize a Luxand-like SmileScoreResult.
   * Maps detector confidence (0–1) + hasGoodConfidence to a 10–100 score.
   */
  setInternalSmileScoreFromDetection(detection: FaceDetectionResult | null) {
    if (!detection || !detection.isDetected) {
      this.smileScore = null;
      return;
    }

    const confidence = typeof detection.confidence === 'number' ? detection.confidence : 0;
    const hasGoodConfidence = detection.hasGoodConfidence ?? confidence > 0.7;

    // Map confidence into 10–100 using two bands:
    // - If hasGoodConfidence (confidence > 0.5): map 0.5–1.0 → 60–100
    // - Otherwise: map 0.0–0.5 → 10–60
    let score: number;
    if (hasGoodConfidence) {
      const safeConf = Math.min(Math.max(confidence, 0.7), 1);
      const t = (safeConf - 0.5) / 0.5; // 0 → 0 at 0.5, 1 → 1 at 1.0
      score = 60 + t * 40; // 60–100
    } else {
      const safeConf = Math.min(Math.max(confidence, 0), 0.7);
      const t = safeConf / 0.5; // 0–1 over 0–0.5
      score = 10 + t * 50; // 10–60
    }

    const clampedScore = Math.max(appConfig.minScore, Math.min(100, Math.round(score)));

    this.apiResponse = null; // No Luxand payload in this mode.
    this.smileScore = {
      score: clampedScore,
      dominantEmotion: hasGoodConfidence ? 'happy' : 'neutral',
      allEmotions: {
        angry: 0,
        disgust: 0,
        fear: 0,
        happy: clampedScore,
        neutral: 100 - clampedScore,
        sad: 0,
        surprise: 0,
      },
      primaryFaceIndex: 0,
      confidence,
    };
  }

  reset() {
    this.apiResponse = null;
    this.smileScore = null;
    this.error = null;
    this.isLoading = false;
  }
}

export const luxandAPIStore = new LuxandAPIStore();

