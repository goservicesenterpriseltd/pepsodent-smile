import { makeAutoObservable } from 'mobx';
import type { LuxandEmotionResponse, SmileScoreResult } from '@/types/luxand-api';
import { uploadImageToLuxand } from '@/lib/api/luxand';
import { calculateSmileScore } from '@/lib/api/luxand';
import { appConfig } from '@/lib/config/app-config';
import { toastStore } from './ToastStore';

class LuxandAPIStore {
  apiResponse: LuxandEmotionResponse | null = null;
  smileScore: SmileScoreResult | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async analyzeImage(imageFile: File) {
    this.isLoading = true;
    this.error = null;

    try {
      // Validate file
      if (!imageFile || imageFile.size === 0) {
        throw new Error('Invalid image file. Please try capturing again.');
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

  reset() {
    this.apiResponse = null;
    this.smileScore = null;
    this.error = null;
    this.isLoading = false;
  }
}

export const luxandAPIStore = new LuxandAPIStore();

