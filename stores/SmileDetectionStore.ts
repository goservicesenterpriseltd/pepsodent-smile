import { makeAutoObservable } from 'mobx';

class SmileDetectionStore {
  isDetecting = false;
  smileConfidence = 0; // 0-1
  isSmiling = false;
  feedbackMessage = '';
  detectionModel: any = null;

  constructor() {
    makeAutoObservable(this);
  }

  setDetecting(detecting: boolean) {
    this.isDetecting = detecting;
  }

  updateSmileConfidence(confidence: number) {
    this.smileConfidence = confidence;
    this.isSmiling = confidence > 0.7;
    
    // Update feedback message
    if (confidence > 0.8) {
      this.feedbackMessage = 'Perfect smile! 😊';
    } else if (confidence > 0.6) {
      this.feedbackMessage = 'Great smile! Keep it up! 😄';
    } else if (confidence > 0.4) {
      this.feedbackMessage = 'More smile please! 😊';
    } else {
      this.feedbackMessage = 'Show us your beautiful smile! 😃';
    }
  }

  setModel(model: any) {
    this.detectionModel = model;
  }

  reset() {
    this.smileConfidence = 0;
    this.isSmiling = false;
    this.feedbackMessage = '';
  }
}

export const smileDetectionStore = new SmileDetectionStore();

