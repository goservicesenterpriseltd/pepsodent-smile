'use client';

import { detectFace, initializeFaceDetector } from '@/lib/detection/face-detector';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { FaceDetectionResult } from '@/lib/detection/face-detector';
import { cameraStore } from '@/stores/CameraStore';
import { toastStore } from '@/stores/ToastStore';
import { observer } from 'mobx-react-lite';

interface CameraPreviewProps {
  onCapture: (file: File, detection: FaceDetectionResult | null) => void;
}

export const CameraPreview = observer(({ onCapture }: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faceDetection, setFaceDetection] = useState<FaceDetectionResult>({
    isDetected: false,
    isWellPositioned: false,
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
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

  const startCameraWithFacingMode = useCallback(async (mode: 'user' | 'environment') => {
    try {
      setError(null);

      const baseVideoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        autoGainControl: true,
        noiseSuppression: true,
        echoCancellation: true,
        facingMode: { ideal: mode },
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...baseVideoConstraints,
            facingMode: { exact: mode },
          },
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...baseVideoConstraints,
            facingMode: mode,
          },
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        streamRef.current = mediaStream;
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
  }, []);

  const switchCamera = useCallback(async () => {
    if (!streamRef.current) return;
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    const previousMode = facingMode;
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setFacingMode(nextMode);
    setError(null);
    try {
      await startCameraWithFacingMode(nextMode);
      if (!streamRef.current) {
        // startCameraWithFacingMode failed (e.g. no rear camera on laptop)
        setFacingMode(previousMode);
        await startCameraWithFacingMode(previousMode);
        toastStore.warning('Rear camera not available on this device');
      }
    } catch {
      setFacingMode(previousMode);
      await startCameraWithFacingMode(previousMode);
      toastStore.warning('Could not switch camera. This device may only have one camera.');
    }
  }, [facingMode, startCameraWithFacingMode]);

  // Start camera on mount (switchCamera handles toggling)
  useEffect(() => {
    startCameraWithFacingMode(facingMode);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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
  }, [startCameraWithFacingMode]); // eslint-disable-line react-hooks/exhaustive-deps -- facingMode used for initial mount only

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
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
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
  }, [isCapturing, onCapture, faceDetection]);

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
  }, [faceDetection.isWellPositioned, countdown, isCapturing]);

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
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative aspect-3/4 sm:aspect-video bg-black rounded-lg overflow-hidden">
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
            <div className="text-6xl sm:text-8xl md:text-9xl font-bold text-white drop-shadow-2xl animate-bounce">
              {countdown}
            </div>
          </div>
        )}

        {/* Camera mode indicator */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium z-10 text-center max-w-[90%]">
          {facingMode === 'environment' ? 'Rear camera' : 'Front camera'}
        </div>

        {faceDetection.isDetected && !faceDetection.isWellPositioned && (
          <div className="absolute top-3 sm:top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 sm:px-4 py-2 rounded-full text-sm sm:text-lg font-semibold z-10 text-center max-w-[90%]">
            Position your face in the circle
          </div>
        )}

        {faceDetection.isWellPositioned && countdown === null && (
          <div className="absolute top-3 sm:top-4 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white px-3 sm:px-4 py-2 rounded-full text-sm sm:text-lg font-semibold z-10 text-center max-w-[90%]">
            Perfect! Get ready... 😊
          </div>
        )}

        {/* Capture ring frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            ref={circleRef}
            className="w-44 h-44 sm:w-64 sm:h-64 border-4 rounded-full transition-all duration-300"
            style={{
              borderColor,
              boxShadow: faceDetection.isWellPositioned 
                ? `0 0 20px ${borderColor}, 0 0 40px ${borderColor}` 
                : 'none',
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          onClick={switchCamera}
          disabled={isCapturing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-full font-medium text-sm hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Switch to ${facingMode === 'user' ? 'rear' : 'front'} camera`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
            <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Switch camera
        </button>
        <button
          onClick={captureImage}
          disabled={isCapturing}
          className="px-5 sm:px-8 py-3 sm:py-4 bg-[#e60012] text-white rounded-full font-bold text-sm sm:text-lg hover:bg-[#ff1a2e] transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isCapturing ? 'Capturing...' : 'Capture Smile'}
        </button>
      </div>
    </div>
  );
});
