'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { CelebrationConfetti } from '@/components/confetti/CelebrationConfetti';
import { Logo } from '@/components/ui/Logo';
import { PepsometerApiError } from '@/lib/api/pepsometer-api';
import type { PersonalizedResponse } from '@/types/responses';
import { ShareModal } from '@/components/share/ShareModal';
import type { SmileAttempt } from '@/types/leaderboard';
import { appConfig } from '@/lib/config/app-config';
import { cameraStore } from '@/stores/CameraStore';
import { getPersonalizedResponse } from '@/lib/responses/response-selector';
import { leaderboardStore } from '@/stores/LeaderboardStore';
import { locationStore } from '@/stores/LocationStore';
import { luxandAPIStore } from '@/stores/LuxandAPIStore';
import { observer } from 'mobx-react-lite';
import { submitActivity } from '@/lib/api/pepsometer-api';
import { toastStore } from '@/stores/ToastStore';
import { uiStore } from '@/stores/UIStore';
import { updateAttemptRemoteId } from '@/lib/persistence/indexeddb';
import { userStore } from '@/stores/UserStore';

export default observer(function ResultsPage() {
  const [response, setResponse] = useState<PersonalizedResponse | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState<SmileAttempt | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [remoteId, setRemoteId] = useState<string | null>(null);
  const savedScoreIdRef = useRef<string | null>(null);
  const submittedScoreIdRef = useRef<string | null>(null);

  const [syncState, setSyncState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Persist the backend remoteId into the saved attempt once BOTH exist.
  // This avoids a race where the submit finishes before the attempt is saved / currentAttempt state is set.
  useEffect(() => {
    let cancelled = false;

    const persistRemoteId = async () => {
      if (!remoteId || !currentAttempt) return;
      if (currentAttempt.remoteId === remoteId) return;

      try {
        await updateAttemptRemoteId(currentAttempt.id, remoteId);
        if (!cancelled) {
          setCurrentAttempt((prev) => (prev ? { ...prev, remoteId } : prev));
        }
      } catch (e) {
        console.error('Failed to persist remoteId to IndexedDB:', e);
      }
    };

    persistRemoteId();

    return () => {
      cancelled = true;
    };
  }, [remoteId, currentAttempt]);

  useEffect(() => {
    const saveAttemptAndUpdateCount = async () => {
      // Only save attempt if API successfully returned a valid score and we haven't saved this score yet
      const scoreId = luxandAPIStore.smileScore
        ? `${luxandAPIStore.smileScore.score}-${luxandAPIStore.smileScore.confidence}`
        : null;

      if (
        luxandAPIStore.smileScore &&
        luxandAPIStore.hasValidScore &&
        userStore.user &&
        scoreId &&
        savedScoreIdRef.current !== scoreId
      ) {
        savedScoreIdRef.current = scoreId;

        // Reset per-attempt sync/share state (prevents old remoteId being applied to a new attempt)
        setRemoteId(null);
        setSyncState('idle');
        setSyncError(null);
        setShowShareModal(false);
        setCurrentAttempt(null);

        const personalized = getPersonalizedResponse(
          luxandAPIStore.smileScore.score,
          userStore.user.name
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
          email: '',
          firstName: userStore.user.name || '',
          lastName: '',
          phone: userStore.user.phone || '',
          gender: '',
          score: luxandAPIStore.smileScore.score,
          timestamp: Date.now(),
          imageData: imageData || undefined, // Store base64 image data for leaderboard display
        };

        console.log('Saving attempt for user:', {
          name: userStore.user.name,
          phone: userStore.user.phone,
          hasImageData: !!imageData,
          imageDataLength: imageData?.length || 0,
          score: attempt.score,
        });

        // Wait for attempt to be saved and store to be updated
        try {
          console.log('Calling leaderboardStore.addAttempt...');
          const saved = await leaderboardStore.addAttempt(attempt);
          console.log('addAttempt result:', saved);

          if (saved) {
            // Store current attempt for sharing
            setCurrentAttempt(attempt);

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
            console.error('Failed to save attempt - addAttempt returned false');
            console.error('LeaderboardStore error:', leaderboardStore.error);
            console.error('User data:', {
              name: userStore.user.name,
              phone: userStore.user.phone,
              hasName: !!userStore.user.name,
              hasPhone: !!userStore.user.phone,
            });
            // Reset the ref so user can try again if needed
            savedScoreIdRef.current = null;
          }
        } catch (error) {
          console.error('Error saving attempt:', error);
          console.error('Error details:', error instanceof Error ? error.stack : error);
          // Reset the ref so user can try again if needed
          savedScoreIdRef.current = null;
        }

        // Only clear image after successful save (keep it for retry if save fails)
        // Note: We keep the image in store even after saving so it can be used for retry
        // The image will be cleared when user starts a new capture or resets
      }
    };

    // Only run if we have a score and haven't processed it yet
    if (luxandAPIStore.smileScore && luxandAPIStore.hasValidScore && userStore.user) {
      saveAttemptAndUpdateCount();
    }

    // Stop camera when results are shown (but keep image data for leaderboard)
    cameraStore.stopCamera();
    // Don't clear image here - keep it for leaderboard display and potential retry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [luxandAPIStore.smileScore?.score, userStore.user?.phone]);

  const canSubmitToPepsometer =
    !!userStore.user &&
    !!luxandAPIStore.smileScore &&
    !!cameraStore.imageDataBase64 &&
    !!locationStore.selected;

  const getSubmitErrorMessage = (e: unknown) => {
    if (e instanceof PepsometerApiError) {
      if (e.status >= 500) return 'A server error occurred. Please try again.';
      if (e.body && typeof e.body === 'object' && 'message' in e.body) {
        const msg = (e.body as { message?: unknown }).message;
        if (typeof msg === 'string' && msg.trim()) return msg;
      }
      return e.message;
    }
    return e instanceof Error ? e.message : 'Failed to sync. Please try again.';
  };

  const submitToPepsometer = async () => {
    if (!luxandAPIStore.smileScore || !userStore.user) return;

    if (!locationStore.selected) {
      setSyncState('error');
      setSyncError('Please select a location (bottom-right) to sync your result.');
      return;
    }

    if (!cameraStore.imageDataBase64) {
      setSyncState('error');
      setSyncError('Missing image data. Please retry the capture.');
      return;
    }

    setSyncState('submitting');
    setSyncError(null);

    try {
      // Split name into first_name and last_name for API
      // If name has multiple words, use first word as first_name, rest as last_name
      // Otherwise, put entire name in first_name
      const nameParts = (userStore.user.name || '').trim().split(/\s+/);
      const first_name = nameParts[0] || null;
      const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      const payload = {
        location_id: locationStore.selected.id,
        email: null,
        phone_number: userStore.user.phone || null,
        first_name: first_name,
        other_name: null,
        last_name: last_name,
        gender: null,
        score: Math.round(luxandAPIStore.smileScore.score),
        image_base64: cameraStore.imageDataBase64,
      };

      const res = await submitActivity(payload);

      if (!res?.status) {
        throw new Error(res?.message || 'Sync failed');
      }

      // Store backend remote ID (from data.id) for sharing
      const remoteIdValue =
        (res.data && typeof res.data.id !== 'undefined' && res.data.id !== null
          ? String(res.data.id)
          : null);
      if (remoteIdValue) {
        setRemoteId(remoteIdValue);
        console.log('got value for remoteId', remoteIdValue);
      }

      setSyncState('success');
      toastStore.success('Synced successfully.');
    } catch (e) {
      const msg = getSubmitErrorMessage(e);
      setSyncState('error');
      setSyncError(msg);
      toastStore.error('Sync failed. Tap Sync to retry.');
    }
  };

  useEffect(() => {
    // Auto-submit once per score
    const scoreId = luxandAPIStore.smileScore
      ? `${luxandAPIStore.smileScore.score}-${luxandAPIStore.smileScore.confidence}`
      : null;

    if (!scoreId) return;
    if (submittedScoreIdRef.current === scoreId) return;

    // Only attempt auto-submit when we have the minimum data
    if (!userStore.user || !luxandAPIStore.hasValidScore) return;

    submittedScoreIdRef.current = scoreId;
    submitToPepsometer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [luxandAPIStore.smileScore?.score, luxandAPIStore.smileScore?.confidence, userStore.user?.phone, locationStore.selected?.id]);

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
  const scoreColor = score >= 80 ? '#000000' : score >= 60 ? '#1a1a1a' : '#000000';
  const maxAttempts = appConfig.maxAttempts;

  // Get current count from store (reactive to MobX changes)
  const currentCount = userStore.user ? leaderboardStore.getAttemptCount(userStore.user) : 0;
  const displayCount = attemptCount > 0 ? attemptCount : currentCount;

  const canRetry = displayCount < maxAttempts;
  const nextAttemptNumber = displayCount;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-3 sm:p-4 relative">
      <CelebrationConfetti score={score} trigger={showConfetti} />
      {/* Logo Top Right */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-24 h-16 sm:w-32 sm:h-24 z-10">
        <Logo width={128} height={96} />
      </div>
      
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border-2 border-black p-5 sm:p-8 md:p-12 space-y-6 sm:space-y-8 text-center mt-12 sm:mt-0">
        {/* Score Display */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-black">
            Your Smile Score
          </h2>
          <div className="relative inline-block">
            <div
              className="text-6xl sm:text-8xl font-bold"
              style={{ color: scoreColor }}
            >
              {Math.round(score)}
            </div>
            <div className="text-lg sm:text-2xl text-gray-500">/ 100</div>
          </div>
        </div>

        {/* Personalized Message */}
        <div className="bg-black text-white rounded-lg p-4 sm:p-6">
          <p className="text-base sm:text-xl md:text-2xl leading-relaxed">
            {response.message}
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-100 rounded-lg p-4 border border-black/10">
            <div className="text-gray-600 mb-1">Dominant Emotion</div>
            <div className="font-semibold text-black capitalize">
              {luxandAPIStore.primaryEmotion}
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 border border-black/10">
            <div className="text-gray-600 mb-1">Confidence</div>
            <div className="font-semibold text-black">
              {Math.round(luxandAPIStore.smileScore.confidence * 100)}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="accent"
              size="lg"
              onClick={handlePlayAgain}
              className="flex-1"
              disabled={syncState === 'submitting' || syncState === 'error'}
            >
              Play Again 😊
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleRetry}
              className="flex-1"
              disabled={!canRetry || syncState === 'submitting' || syncState === 'error'}
            >
              Retry (Attempt {nextAttemptNumber} of {maxAttempts})
            </Button>
          </div>
          {syncState === 'error' && (
            <Button
              variant="primary"
              size="lg"
              onClick={submitToPepsometer}
              className="flex-1 w-full"
              disabled={!canSubmitToPepsometer}
            >
              Resubmit 🔄
            </Button>
          )}
          {syncState === 'submitting' && (
            <div className="text-sm text-gray-600">Syncing your result…</div>
          )}
          {syncState === 'error' && (
            <div className="text-sm text-red-700">
              <div className="font-semibold">Couldn’t sync your result.</div>
              <div className="text-xs mt-1 break-words">{syncError}</div>
            </div>
          )}
          {currentAttempt && remoteId && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowShareModal(true)}
              className="w-full"
            >
              Share Your Score 📤
            </Button>
          )}
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-2">
              Debug: count={displayCount}, state={attemptCount}, store={currentCount}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {currentAttempt && remoteId && (
        <ShareModal
          attempt={currentAttempt}
          remoteId={remoteId}
          faceRegion={luxandAPIStore.apiResponse?.faces?.[0]?.region}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
});

