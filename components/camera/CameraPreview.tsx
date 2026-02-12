'use client';

import { detectFace, initializeFaceDetector } from '@/lib/detection/face-detector';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { FaceDetectionResult } from '@/lib/detection/face-detector';
import { cameraStore } from '@/stores/CameraStore';
import { observer } from 'mobx-react-lite';

interface CameraPreviewProps {
  onCapture: (file: File, detection: FaceDetectionResult | null) => void;
}

export const CameraPreview = observer(({ onCapture }: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faceDetection, setFaceDetection] = useState<FaceDetectionResult>({
    isDetected: false,
    isWellPositioned: false,
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stabilityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stablePositionRef = useRef<number>(0); // Track how long face has been well-positioned
  const countdownStartedRef = useRef<boolean>(false); // Track if countdown has started

  // Initialize face detector
  useEffect(() => {
    initializeFaceDetector().catch(err => {
      console.error('Failed to initialize face detector:', err);
    });
  }, []);

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            autoGainControl: true,
            noiseSuppression: true,
            echoCancellation: true,
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
          cameraStore.setActiveStream(mediaStream);
          cameraStore.setCameraActive(true);
          cameraStore.setPermission(true);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
        setError(errorMessage);
        cameraStore.setError(errorMessage);
        cameraStore.setPermission(false);
      }
    };

    startCamera();

    return () => {
      // Cleanup: stop camera when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (stabilityIntervalRef.current) {
        clearInterval(stabilityIntervalRef.current);
      }
      cameraStore.setActiveStream(null);
      cameraStore.setCameraActive(false);
    };
  }, []);

  // Face detection loop
  useEffect(() => {
    if (!videoRef.current || !circleRef.current || isCapturing) return;

    const video = videoRef.current;
    const circle = circleRef.current;
    
    // Get circle position and size
    const getCircleInfo = () => {
      const rect = circle.getBoundingClientRect();
      const containerRect = video.getBoundingClientRect();
      return {
        centerX: rect.left + rect.width / 2 - containerRect.left,
        centerY: rect.top + rect.height / 2 - containerRect.top,
        radius: rect.width / 2,
      };
    };

    const detect = async () => {
      if (video.readyState >= 2) {
        const circleInfo = getCircleInfo();
        const result = await detectFace(video, circleInfo);
        setFaceDetection(result);
      }
    };

    // Start detection loop
    detectionIntervalRef.current = setInterval(detect, 200); // Check every 200ms

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isCapturing]);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || isCapturing) {
      return;
    }

    setIsCapturing(true);
    
    // Stop detection and countdown
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdown(null);

    // Check if video is ready and has valid dimensions
    const video = videoRef.current;
    if (video.readyState < 2) {
      console.warn('Video not ready yet');
      setIsCapturing(false);
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight || videoWidth === 0 || videoHeight === 0) {
      console.error('Invalid video dimensions:', { videoWidth, videoHeight });
      setIsCapturing(false);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        setIsCapturing(false);
        return;
      }

      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Failed to create blob from canvas');
            setIsCapturing(false);
            return;
          }

          // Validate blob size
          if (blob.size === 0) {
            console.error('Captured image is empty');
            setIsCapturing(false);
            return;
          }

          const file = new File([blob], 'smile.jpg', { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          cameraStore.setCapturedImage(file, previewUrl);
          
          // Stop camera after capture to save energy
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
            cameraStore.setActiveStream(null);
            cameraStore.setCameraActive(false);
          }
          
          setIsCapturing(false);
          onCapture(file, faceDetection || null);
        },
        'image/jpeg',
        0.9
      );
    } catch (err) {
      console.error('Failed to capture image:', err);
      setIsCapturing(false);
    }
  }, [stream, isCapturing, onCapture, faceDetection]);

  // Stability check - when face becomes well-positioned
  useEffect(() => {
    // Check stability: face needs to be well-positioned for at least 1 second before countdown starts
    const STABILITY_THRESHOLD = 1000; // 1 second in milliseconds
    
    // Clear any existing stability interval
    if (stabilityIntervalRef.current) {
      clearInterval(stabilityIntervalRef.current);
      stabilityIntervalRef.current = null;
    }
    
    if (faceDetection.isWellPositioned && !countdown && !isCapturing) {
      console.log('Face is well-positioned, starting stability check...');
      stablePositionRef.current = 0; // Reset counter
      
      // Start stability timer that increments every 100ms
      stabilityIntervalRef.current = setInterval(() => {
        stablePositionRef.current += 100;
        console.log(`Stability: ${stablePositionRef.current}ms / ${STABILITY_THRESHOLD}ms`);
        
        // Only start countdown if face has been stable for threshold time
        if (stablePositionRef.current >= STABILITY_THRESHOLD) {
          if (stabilityIntervalRef.current) {
            clearInterval(stabilityIntervalRef.current);
            stabilityIntervalRef.current = null;
          }
          
          console.log('Stability threshold reached! Starting countdown...');
          // Start countdown
          countdownStartedRef.current = true;
          setCountdown(3);
          stablePositionRef.current = 0; // Reset stability counter
        }
      }, 100); // Check every 100ms
    } else if (!faceDetection.isWellPositioned) {
      // Reset stability counter if face moves out of position
      console.log('Face moved out of position, resetting stability...');
      stablePositionRef.current = 0;
      
      // Clear stability interval
      if (stabilityIntervalRef.current) {
        clearInterval(stabilityIntervalRef.current);
        stabilityIntervalRef.current = null;
      }
      
      // Reset countdown if it was active
      if (countdown) {
        setCountdown(null);
        countdownStartedRef.current = false;
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    }

    return () => {
      if (stabilityIntervalRef.current) {
        clearInterval(stabilityIntervalRef.current);
        stabilityIntervalRef.current = null;
      }
    };
  }, [faceDetection.isWellPositioned, isCapturing]);

  // Countdown interval - separate effect that runs when countdown starts
  useEffect(() => {
    // Only start countdown interval if countdown is set to 3, we've marked it as started, and not already running
    if (countdown === 3 && countdownStartedRef.current && !countdownIntervalRef.current && !isCapturing) {
      console.log(`Starting countdown from ${countdown}...`);
      countdownStartedRef.current = false; // Reset flag so we don't restart
      
      let currentCount = 3;
      
      countdownIntervalRef.current = setInterval(() => {
        currentCount -= 1;
        console.log(`Countdown: ${currentCount}`);
        
        if (currentCount <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setCountdown(null);
          // Auto-capture
          console.log('Countdown complete! Capturing...');
          captureImage();
        } else {
          setCountdown(currentCount);
        }
      }, 1000);
    }

    // Cleanup: only clear interval if countdown is reset to null
    if (countdown === null && countdownIntervalRef.current) {
      console.log('Clearing countdown interval');
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      countdownStartedRef.current = false;
    }
  }, [countdown, isCapturing, captureImage]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg">
        <p className="text-[#e60012] mb-4">{error}</p>
        <p className="text-sm text-gray-600">Please allow camera access to continue</p>
      </div>
    );
  }

  const borderColor = faceDetection.isWellPositioned ? '#10b981' : '#e60012'; // Green or Red
  const borderAnimation = faceDetection.isWellPositioned ? 'animate-pulse' : 'animate-pulse';

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Countdown overlay */}
        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="text-9xl font-bold text-white drop-shadow-2xl animate-bounce">
              {countdown}
            </div>
          </div>
        )}

        {/* Face detection feedback */}
        {faceDetection.isDetected && !faceDetection.isWellPositioned && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-lg font-semibold z-10">
            Position your face in the circle
          </div>
        )}

        {faceDetection.isWellPositioned && countdown === null && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white px-4 py-2 rounded-full text-lg font-semibold z-10">
            Perfect! Get ready... 😊
          </div>
        )}

        {/* Capture ring frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            ref={circleRef}
            className="w-64 h-64 border-4 rounded-full transition-all duration-300"
            style={{
              borderColor,
              boxShadow: faceDetection.isWellPositioned 
                ? `0 0 20px ${borderColor}, 0 0 40px ${borderColor}` 
                : 'none',
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={captureImage}
          disabled={isCapturing}
          className="px-8 py-4 bg-[#e60012] text-white rounded-full font-bold text-lg hover:bg-[#ff1a2e] transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isCapturing ? 'Capturing...' : '📸 Capture Smile (Fallback)'}
        </button>
      </div>
    </div>
  );
});
