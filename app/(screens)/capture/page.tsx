'use client';

import { CameraPreview } from '@/components/camera/CameraPreview';
import { Logo } from '@/components/ui/Logo';
import { cameraStore } from '@/stores/CameraStore';
import { fileToBase64 } from '@/lib/image/image-storage';
import { luxandAPIStore } from '@/stores/LuxandAPIStore';
import { observer } from 'mobx-react-lite';
import { optimizeImageForUpload } from '@/lib/image/image-capture';
import { toastStore } from '@/stores/ToastStore';
import { uiStore } from '@/stores/UIStore';
import { useEffect } from 'react';
import { userStore } from '@/stores/UserStore';
import type { FaceDetectionResult } from '@/lib/detection/face-detector';

export default observer(function CapturePage() {
  // Redirect to personalize if user data is incomplete
  useEffect(() => {
    if (!userStore.isComplete) {
      uiStore.navigateTo('personalize');
    }
  }, [userStore.isComplete]);

  // Cleanup camera when component unmounts or when navigating away
  useEffect(() => {
    return () => {
      // Stop camera when leaving capture page
      cameraStore.stopCamera();
    };
  }, []);

  const handleCapture = async (file: File, detection: FaceDetectionResult | null) => {
    try {
      // Validate file before processing
      if (!file || file.size === 0) {
        toastStore.error('Invalid image captured. Please try again.');
        return;
      }

      // Store the original image as base64 for leaderboard (before optimization)
      // This ensures we have the full quality image for leaderboard display
      const imageData = await fileToBase64(file);
      cameraStore.setImageData(imageData);
      
      // Store in camera store for preview
      cameraStore.setCapturedImage(file, URL.createObjectURL(file));
      
      if (luxandAPIStore.useInternalScoring) {
        // Use our own face detector data to derive a score instead of calling Luxand.
        if (!detection || !detection.isDetected) {
          toastStore.error('No face data available for scoring. Please recapture your smile.');
          uiStore.navigateTo('capture');
          return;
        }

        luxandAPIStore.setInternalSmileScoreFromDetection(detection);

        if (luxandAPIStore.hasValidScore && luxandAPIStore.smileScore) {
          uiStore.navigateTo('processing');
          uiStore.navigateTo('results');
        } else {
          toastStore.error('Failed to compute a score from the camera data. Please try again.');
          uiStore.navigateTo('capture');
        }
      } else {
        // Optimize image for API upload (smaller size, faster upload)
        const optimizedFile = await optimizeImageForUpload(file);
        
        // Navigate to processing
        uiStore.navigateTo('processing');
        
        // Analyze image - only proceed if API call succeeds
        await luxandAPIStore.analyzeImage(optimizedFile);
        
        // Only navigate to results if API returned a valid score
        // This ensures we only count attempts with successful API responses
        if (luxandAPIStore.hasValidScore && luxandAPIStore.smileScore) {
          // Navigate to results (camera will be stopped in results page useEffect)
          uiStore.navigateTo('results');
        } else {
          // If no valid score, show error and stay on capture page
          toastStore.error('Failed to get a valid score. Please try again.');
          uiStore.navigateTo('capture');
        }
      }
    } catch (error) {
      console.error('Error processing image:', error);
      
      // Use the error message from the store if available, otherwise use a generic one
      const errorMessage = luxandAPIStore.error || 
        (error instanceof Error ? error.message : 'Failed to process your smile. Please try again.');
      
      // Show error in toast
      toastStore.error(errorMessage);
      uiStore.navigateTo('capture');
      
      // Reset the API store error
      luxandAPIStore.error = null;
    }
  };

  // Don't render if user data is incomplete (will redirect via useEffect)
  if (!userStore.isComplete) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 relative">
      {/* Logo Top Right */}
      <div className="absolute top-4 left-4 w-32 h-24 z-10">
        <Logo width={128} height={96} />
      </div>
      
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Show Us Your Smile, {userStore.user?.name?.split(/\s+/)[0] || 'there'}! 😊
          </h1>
          <p className="text-white/80 text-lg mb-2">
          Smile wide. We&apos;re counting down.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mt-4 max-w-md mx-auto border border-white/20">
            <p className="text-white/90 text-sm">
              💡 <strong>Tips:</strong> Make sure your face is clearly visible, well-lit, and centered in the frame
            </p>
            <p className="text-white/90 text-sm mt-2">
              😁 Show your teeth for the best smile score
            </p>
          </div>
        </div>

        <CameraPreview onCapture={handleCapture} />
      </div>
    </div>
  );
});

