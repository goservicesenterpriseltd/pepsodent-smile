'use client';

import { captureElementToPngBlob, downloadImage, shareImage } from '@/lib/share/share-utils';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { GameShareCard } from '@/components/share/GameShareCard';
import type { LuxandFaceRegion } from '@/types/luxand-api';
import type { SmileAttempt } from '@/types/leaderboard';
import { getActivity } from '@/lib/api/pepsometer-api';
import { getAttemptById } from '@/lib/persistence/indexeddb';
import { getShareUrl } from '@/lib/share/share-utils';
import { useParams } from 'next/navigation';

export default function SharePage() {
  const params = useParams();
  const attemptId = params?.id as string;
  const [attempt, setAttempt] = useState<SmileAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasShared, setHasShared] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  // Ref to the outer card frame rendered by GameShareCard
  const shareCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadAttempt = async () => {
      if (!attemptId) {
        setIsLoading(false);
        return;
      }

      try {
        // First, try to fetch from Pepsometer API (works across devices)
        try {
          const apiRes = await getActivity(attemptId);
          if (apiRes?.status && apiRes.data) {
            const data = apiRes.data;
            console.log('apiRes', data);

            const rawScore = (data as { score?: unknown; pepsometer_score?: unknown }).score ??
              (data as { pepsometer_score?: unknown }).pepsometer_score;

            const score =
              typeof rawScore === 'number'
                ? rawScore
                : typeof rawScore === 'string'
                  ? Number.parseFloat(rawScore)
                  : 0;

            // Map player details from backend response
            const player = (data as { player?: unknown }).player as
              | {
                  first_name?: string;
                  last_name?: string;
                  email?: string;
                  phone_number?: string;
                  gender?: string;
                }
              | undefined;

            const apiAttempt: SmileAttempt = {
              id: attemptId,
              remoteId: attemptId,
              email: player?.email || '',
              firstName: player?.first_name || '',
              lastName: player?.last_name || '',
              phone: player?.phone_number || '',
              gender: player?.gender || '',
              // Normalized numeric score (backend may send string)
              score: Number.isFinite(score) ? score : 0,
              timestamp: Date.now(),
              // Used as <img src>; backend provides a URL
              imageData: (data as { image_url?: string }).image_url ?? undefined,
            };

            setAttempt(apiAttempt);
            setIsLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('Failed to fetch activity from API, trying IndexedDB:', apiError);
        }

        // Fallback to IndexedDB (only works on same device/browser)
        const localAttempt = await getAttemptById(attemptId);
        if (localAttempt) {
          setAttempt(localAttempt);
        } else {
          console.error('Attempt not found in API or IndexedDB:', attemptId);
        }
      } catch (error) {
        console.error('Error loading attempt:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttempt();
  }, [attemptId]);

  const handleShare = async () => {
    if (!attempt || !shareCardRef.current) return;

    setIsSharing(true);
    try {
      const shareUrl = getShareUrl(attempt.id);
      const title = `I scored ${Math.round(attempt.score)} on the Pepso-Meter! 😊`;
      const text = `Check out my Pepso Confidence Score! Can you beat ${Math.round(attempt.score)}?`;

      // Try to capture the GameShareCard frame as an image and share it
      const blob = await captureElementToPngBlob(shareCardRef.current);

      if (blob) {
        const shared = await shareImage(blob, title, text);
        if (shared) {
          setHasShared(true);
          return;
        }
      }

      // Fallbacks: if image sharing failed or not supported, try URL sharing
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        setHasShared(true);
        return;
      }

      // Final fallback: copy URL to clipboard
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareUrl);
        setHasShared(true);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!shareCardRef.current || !attempt) return;

    setIsDownloading(true);

    try {
      const blob = await captureElementToPngBlob(shareCardRef.current);

      if (blob) {
        downloadImage(blob, `pepsodent-smile-${attempt.score}.png`);
      }
    } catch (error) {
      console.error('Error downloading:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#f5f5f5] to-[#e0e0e0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto mb-4"></div>
          <p className="text-[#003366]">Loading your share card...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#f5f5f5] to-[#e0e0e0]">
        <div className="text-center max-w-md p-6">
          <h1 className="text-2xl font-bold text-[#003366] mb-4">Share Card Not Found</h1>
          <p className="text-gray-600 mb-6">
            The share card you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button
            variant="primary"
            onClick={() => (window.location.href = '/')}
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-[#f5f5f5] to-[#e0e0e0] p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#003366] mb-2">
            Share Your Pepso Confidence Score!
          </h1>
          <p className="text-gray-600">
            {attempt.firstName} scored {Math.round(attempt.score)} on the Pepso-Meter
          </p>
        </div>

        {/* Share Card */}
        <div className="flex justify-center bg-white rounded-2xl shadow-xl p-4">
          <div className="w-full max-w-[500px] flex justify-center">
            <GameShareCard
              ref={shareCardRef}
              userImageSrc={attempt.imageData || ''}
              // GameShareCard expects a number; backend score may be string, but we normalized it
              score={Number.isFinite(attempt.score) ? attempt.score : Number(attempt.score) || 0}
              className="w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1"
          >
            {isSharing ? 'Preparing...' : hasShared ? 'Share Again' : 'Tap to Share'}
          </Button>
          <Button
            variant="accent"
            size="lg"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1"
          >
            {isDownloading ? 'Generating...' : 'Download Image'}
          </Button>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Share your score and challenge your friends! 😊</p>
        </div>
      </div>
    </div>
  );
}

