'use client';

import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { CameraPreview } from '@/components/camera/CameraPreview';
import { userStore } from '@/stores/UserStore';
import { cameraStore } from '@/stores/CameraStore';
import { luxandAPIStore } from '@/stores/LuxandAPIStore';
import { uiStore } from '@/stores/UIStore';
import { optimizeImageForUpload } from '@/lib/image/image-capture';
import { fileToBase64 } from '@/lib/image/image-storage';

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

  const handleCapture = async (file: File) => {
    try {
      // Validate file before processing
      if (!file || file.size === 0) {
        uiStore.setError('Invalid image captured. Please try again.');
        return;
      }

      // Store the original image as base64 for leaderboard (before optimization)
      const imageData = await fileToBase64(file);
      cameraStore.setImageData(imageData);
      
      // Store in camera store for preview
      cameraStore.setCapturedImage(file, URL.createObjectURL(file));
      
      // Optimize image for API upload
      const optimizedFile = await optimizeImageForUpload(file);
      
      // Navigate to processing
      uiStore.navigateTo('processing');
      
      // Analyze image
      await luxandAPIStore.analyzeImage(optimizedFile);
      
      // Navigate to results (camera will be stopped in results page useEffect)
      uiStore.navigateTo('results');
    } catch (error) {
      console.error('Error processing image:', error);
      
      // Use the error message from the store if available, otherwise use a generic one
      const errorMessage = luxandAPIStore.error || 
        (error instanceof Error ? error.message : 'Failed to process your smile. Please try again.');
      
      uiStore.setError(errorMessage);
      uiStore.navigateTo('capture');
      
      // Reset the API store error after displaying
      setTimeout(() => {
        luxandAPIStore.error = null;
      }, 5000);
    }
  };

  // Don't render if user data is incomplete (will redirect via useEffect)
  if (!userStore.isComplete) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#003366] via-[#004d99] to-[#002244] p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Show Us Your Smile, {userStore.user?.firstName}! 😊
          </h1>
          <p className="text-white/80 text-lg mb-2">
            Position your face in the ring and smile your brightest!
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mt-4 max-w-md mx-auto">
            <p className="text-white/90 text-sm">
              💡 <strong>Tips:</strong> Make sure your face is clearly visible, well-lit, and centered in the frame
            </p>
          </div>
        </div>

        <CameraPreview onCapture={handleCapture} />

        {uiStore.error && (
          <div className="bg-[#e60012]/20 border-2 border-[#e60012] text-white p-4 rounded-lg text-center space-y-2">
            <p className="font-semibold">{uiStore.error}</p>
            <p className="text-sm text-white/80">
              Please make sure your face is clearly visible and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

