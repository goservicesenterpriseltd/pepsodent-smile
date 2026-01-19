'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { CelebrationConfetti } from '@/components/confetti/CelebrationConfetti';
import type { PersonalizedResponse } from '@/types/responses';
import type { SmileAttempt } from '@/types/leaderboard';
import { appConfig } from '@/lib/config/app-config';
import { cameraStore } from '@/stores/CameraStore';
import { getPersonalizedResponse } from '@/lib/responses/response-selector';
import { leaderboardStore } from '@/stores/LeaderboardStore';
import { luxandAPIStore } from '@/stores/LuxandAPIStore';
import { observer } from 'mobx-react-lite';
import { uiStore } from '@/stores/UIStore';
import { userStore } from '@/stores/UserStore';

export default observer(function ResultsPage() {
  const [response, setResponse] = useState<PersonalizedResponse | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saveAttemptAndUpdateCount = async () => {
      // Only save attempt if API successfully returned a valid score
      if (luxandAPIStore.smileScore && luxandAPIStore.hasValidScore && userStore.user && !isSaving) {
        setIsSaving(true);
        
        const personalized = getPersonalizedResponse(
          luxandAPIStore.smileScore.score,
          userStore.user.firstName,
          userStore.user.gender
        );
        setResponse(personalized);

        // Show confetti for scores above 60
        if (luxandAPIStore.smileScore.score >= 60) {
          setShowConfetti(true);
        }

        // Get image data from camera store (set in capture page)
        // This should be the original captured image, not the optimized one
        const imageData = cameraStore.imageDataBase64;

        if (!imageData) {
          console.warn('No image data available for leaderboard - attempt will be saved without image');
        } else {
          console.log('Image data available for leaderboard, length:', imageData.length);
        }

        // Save attempt to leaderboard - only count attempts with successful API responses
        // This ensures we only count attempts where the user saw their score
        const attempt: SmileAttempt = {
          id: `${Date.now()}-${Math.random()}`,
          email: userStore.user.email,
          firstName: userStore.user.firstName,
          lastName: userStore.user.lastName,
          phone: userStore.user.phone,
          gender: userStore.user.gender,
          score: luxandAPIStore.smileScore.score,
          timestamp: Date.now(),
          imageData: imageData || undefined, // Store base64 image data for leaderboard display
        };

        console.log('Saving attempt for user:', userStore.user.email, 'phone:', userStore.user.phone);

        // Wait for attempt to be saved and store to be updated
        const saved = await leaderboardStore.addAttempt(attempt);
        
        if (saved) {
          // Small delay to ensure store is updated
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Update attempt count after the attempt is saved
          // Get count from the updated store attempts (should include the new attempt)
          const count = leaderboardStore.getAttemptCount(userStore.user);
          console.log('Attempt saved, sync count:', count);
          setAttemptCount(count);
          
          // Also verify with async method for accuracy
          const asyncCount = await leaderboardStore.getAttemptCountAsync(userStore.user);
          console.log('Async count verification:', asyncCount);
          setAttemptCount(asyncCount);
        } else {
          console.error('Failed to save attempt');
        }

        setIsSaving(false);
        // Only clear image after successful save (keep it for retry if save fails)
        // Note: We keep the image in store even after saving so it can be used for retry
        // The image will be cleared when user starts a new capture or resets
      }
    };

    saveAttemptAndUpdateCount();

    // Stop camera when results are shown (but keep image data for leaderboard)
    cameraStore.stopCamera();
    // Don't clear image here - keep it for leaderboard display and potential retry
  }, [luxandAPIStore.smileScore, isSaving]);

  const handlePlayAgain = () => {
    luxandAPIStore.reset();
    cameraStore.reset();
    userStore.clearUser();
    uiStore.navigateTo('personalize');
  };

  const handleRetry = () => {
    // Don't clear image data on retry - keep it in case user wants to see it
    // Only reset API state and camera, but preserve imageDataBase64
    luxandAPIStore.reset();
    cameraStore.stopCamera();
    // Keep imageDataBase64 for potential display
    uiStore.navigateTo('capture');
  };

  if (!luxandAPIStore.smileScore || !response) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading results...</p>
      </div>
    );
  }

  const score = luxandAPIStore.smileScore.score;
  const scoreColor = score >= 80 ? '#e60012' : score >= 60 ? '#004d99' : '#003366';
  const maxAttempts = appConfig.maxAttempts;
  
  // Get current count from store (reactive to MobX changes)
  const currentCount = userStore.user ? leaderboardStore.getAttemptCount(userStore.user) : 0;
  const displayCount = attemptCount > 0 ? attemptCount : currentCount;
  
  const canRetry = displayCount < maxAttempts;
  const nextAttemptNumber = displayCount;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-[#f5f5f5] to-[#e0e0e0] p-4">
      <CelebrationConfetti score={score} trigger={showConfetti} />

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 space-y-8 text-center">
        {/* Score Display */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#003366]">
            Your Smile Score
          </h2>
          <div className="relative inline-block">
            <div
              className="text-8xl font-bold"
              style={{ color: scoreColor }}
            >
              {Math.round(score)}
            </div>
            <div className="text-2xl text-gray-500">/ 100</div>
          </div>
        </div>

        {/* Personalized Message */}
        <div className="bg-gradient-to-r from-[#003366] to-[#004d99] text-white rounded-lg p-6">
          <p className="text-xl md:text-2xl leading-relaxed">
            {response.message}
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-gray-600 mb-1">Dominant Emotion</div>
            <div className="font-semibold text-[#003366] capitalize">
              {luxandAPIStore.primaryEmotion}
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="text-gray-600 mb-1">Confidence</div>
            <div className="font-semibold text-[#003366]">
              {Math.round(luxandAPIStore.smileScore.confidence * 100)}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            variant="accent"
            size="lg"
            onClick={handlePlayAgain}
            className="flex-1"
          >
            Play Again 😊
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleRetry}
            className="flex-1"
            disabled={!canRetry}
          >
            Retry (Attempt {nextAttemptNumber} of {maxAttempts})
          </Button>
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-2">
              Debug: count={displayCount}, state={attemptCount}, store={currentCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

