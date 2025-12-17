import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

export interface FacePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface FaceDetectionResult {
  isDetected: boolean;
  isWellPositioned: boolean;
  position?: FacePosition;
  confidence?: number;
}

let detector: blazeface.BlazeFaceModel | null = null;
let isModelLoading = false;

/**
 * Initialize the Blazeface face detection model
 */
export async function initializeFaceDetector(): Promise<blazeface.BlazeFaceModel | null> {
  if (detector) {
    return detector;
  }

  if (isModelLoading) {
    // Wait for existing load to complete
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (detector) return detector;
  }

  isModelLoading = true;
  try {
    console.log('Loading Blazeface model...');
    detector = await blazeface.load({
      maxFaces: 1, // Only detect one face
      inputWidth: 128,
      inputHeight: 128,
      iouThreshold: 0.3,
      scoreThreshold: 0.5,
    });
    console.log('Blazeface model loaded successfully');
    isModelLoading = false;
    return detector;
  } catch (error) {
    isModelLoading = false;
    console.error('Failed to initialize face detector:', error);
    return null;
  }
}

/**
 * Detect face in video frame using Blazeface
 */
export async function detectFace(
  videoElement: HTMLVideoElement,
  targetCircle: { centerX: number; centerY: number; radius: number }
): Promise<FaceDetectionResult> {
  if (!videoElement || videoElement.readyState < 2) {
    return { isDetected: false, isWellPositioned: false };
  }

  // Ensure detector is loaded
  if (!detector) {
    await initializeFaceDetector();
  }

  if (!detector) {
    return { isDetected: false, isWellPositioned: false };
  }

  try {
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    if (!videoWidth || !videoHeight) {
      return { isDetected: false, isWellPositioned: false };
    }

    // Detect faces in the video frame
    const predictions = await detector.estimateFaces(videoElement, false);

    if (!predictions || predictions.length === 0) {
      return { isDetected: false, isWellPositioned: false };
    }

    // Get the first (and should be only) face
    const face = predictions[0];

    // Get face bounding box
    const start = face.topLeft as [number, number];
    const end = face.bottomRight as [number, number];
    
    const faceWidth = end[0] - start[0];
    const faceHeight = end[1] - start[1];
    const faceCenterX = start[0] + faceWidth / 2;
    const faceCenterY = start[1] + faceHeight / 2;

    // Convert to screen coordinates (video might be scaled to fit container)
    const scaleX = videoElement.clientWidth / videoWidth;
    const scaleY = videoElement.clientHeight / videoHeight;

    const screenFaceCenterX = faceCenterX * scaleX;
    const screenFaceCenterY = faceCenterY * scaleY;
    const screenFaceWidth = faceWidth * scaleX;
    const screenFaceHeight = faceHeight * scaleY;

    // Calculate distance from face center to circle center
    const distanceFromCenter = Math.sqrt(
      Math.pow(screenFaceCenterX - targetCircle.centerX, 2) +
      Math.pow(screenFaceCenterY - targetCircle.centerY, 2)
    );

    // Calculate face size (use the larger dimension)
    const faceSize = Math.max(screenFaceWidth, screenFaceHeight);

    // Check if face is well positioned:
    // 1. Face center should be within 50% of circle radius from circle center
    // 2. Face size should be between 40% and 120% of circle diameter
    // 3. Confidence should be above 0.7
    const maxDistance = targetCircle.radius * 0.5;
    const minFaceSize = targetCircle.radius * 0.8; // 40% of diameter
    const maxFaceSize = targetCircle.radius * 2.4; // 120% of diameter

    const isWithinCircle = distanceFromCenter < maxDistance;
    const isGoodSize = faceSize >= minFaceSize && faceSize <= maxFaceSize;
    
    // Get confidence score - handle both number and tensor types
    let confidence = 0.5;
    if (face.probability) {
      if (typeof face.probability === 'number') {
        confidence = face.probability;
      } else if (Array.isArray(face.probability)) {
        confidence = face.probability[0] || 0.5;
      }
    }
    
    const hasGoodConfidence = confidence > 0.7;

    const isWellPositioned = isWithinCircle && isGoodSize && hasGoodConfidence;
    
    // Debug logging (can be removed in production)
    console.log('Face Detection:', {
      isDetected: true,
      isWellPositioned,
      distanceFromCenter: Math.round(distanceFromCenter),
      maxDistance: Math.round(maxDistance),
      isWithinCircle,
      faceSize: Math.round(faceSize),
      minFaceSize: Math.round(minFaceSize),
      maxFaceSize: Math.round(maxFaceSize),
      isGoodSize,
      confidence: Math.round(confidence * 100) / 100,
      hasGoodConfidence,
    });

    return {
      isDetected: true,
      isWellPositioned,
      position: {
        x: start[0] * scaleX,
        y: start[1] * scaleY,
        width: screenFaceWidth,
        height: screenFaceHeight,
        centerX: screenFaceCenterX,
        centerY: screenFaceCenterY,
      },
      confidence,
    };
  } catch (error) {
    console.error('Face detection error:', error);
    return { isDetected: false, isWellPositioned: false };
  }
}
