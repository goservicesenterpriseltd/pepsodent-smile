import { makeAutoObservable } from 'mobx';

class CameraStore {
  isCameraActive = false;
  hasPermission = false;
  error: string | null = null;
  capturedImage: File | null = null;
  imagePreviewUrl: string | null = null;
  imageDataBase64: string | null = null; // Base64 encoded image for storage
  activeStream: MediaStream | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setCameraActive(active: boolean) {
    this.isCameraActive = active;
  }

  setPermission(granted: boolean) {
    this.hasPermission = granted;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setCapturedImage(image: File, previewUrl: string) {
    this.capturedImage = image;
    this.imagePreviewUrl = previewUrl;
  }

  setImageData(base64: string) {
    this.imageDataBase64 = base64;
  }

  setActiveStream(stream: MediaStream | null) {
    this.activeStream = stream;
  }

  stopCamera() {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => {
        track.stop();
      });
      this.activeStream = null;
    }
    this.isCameraActive = false;
  }

  clearImage() {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    this.capturedImage = null;
    this.imagePreviewUrl = null;
    this.imageDataBase64 = null;
  }

  reset() {
    this.stopCamera();
    this.clearImage();
    this.error = null;
  }
}

export const cameraStore = new CameraStore();

