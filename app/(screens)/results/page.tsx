'use client';

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@/components/ui/Button';
import { CelebrationConfetti } from '@/components/confetti/CelebrationConfetti';
import { userStore } from '@/stores/UserStore';
import { luxandAPIStore } from '@/stores/LuxandAPIStore';
import { leaderboardStore } from '@/stores/LeaderboardStore';
import { cameraStore } from '@/stores/CameraStore';
import { uiStore } from '@/stores/UIStore';
import { getPersonalizedResponse } from '@/lib/responses/response-selector';
import type { PersonalizedResponse } from '@/types/responses';
import type { SmileAttempt } from '@/types/leaderboard';

export default observer(function ResultsPage() {
  const [response, setResponse] = useState<PersonalizedResponse | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (luxandAPIStore.smileScore && userStore.user) {
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
      const imageData = cameraStore.imageDataBase64;

      // Save attempt to leaderboard
      const attempt: SmileAttempt = {
        id: `${Date.now()}-${Math.random()}`,
        email: userStore.user.email,
        firstName: userStore.user.firstName,
        lastName: userStore.user.lastName,
        phone: userStore.user.phone,
        gender: userStore.user.gender,
        score: luxandAPIStore.smileScore.score,
        timestamp: Date.now(),
        imageData: imageData || undefined, // Store base64 image data (replaces previous image for this user)
      };

      leaderboardStore.addAttempt(attempt);
      
      // Clear user form data after rating is given
      userStore.clearUser();
    }

    // Stop camera and clear capture state when results are shown
    cameraStore.stopCamera();
    cameraStore.clearImage();
  }, [luxandAPIStore.smileScore]);

  const handlePlayAgain = () => {
    luxandAPIStore.reset();
    cameraStore.reset();
    uiStore.navigateTo('capture');
  };

  const handleViewLeaderboard = () => {
    // Navigate to separate leaderboard page
    window.location.href = '/leaderboard';
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
            onClick={handleViewLeaderboard}
            className="flex-1"
          >
            View Leaderboard 🏆
          </Button>
        </div>
      </div>
    </div>
  );
});

