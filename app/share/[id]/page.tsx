'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import { ShareCard } from '@/components/share/ShareCard';
import { getAttemptById } from '@/lib/persistence/indexeddb';
import { shareImage, downloadImage } from '@/lib/share/share-utils';
import type { SmileAttempt } from '@/types/leaderboard';
import type { LuxandFaceRegion } from '@/types/luxand-api';
import { Button } from '@/components/ui/Button';

export default function SharePage() {
  const params = useParams();
  const attemptId = params?.id as string;
  const [attempt, setAttempt] = useState<SmileAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasShared, setHasShared] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAttempt = async () => {
      if (!attemptId) {
        setIsLoading(false);
        return;
      }

      try {
        const loadedAttempt = await getAttemptById(attemptId);
        if (loadedAttempt) {
          setAttempt(loadedAttempt);
        } else {
          console.error('Attempt not found:', attemptId);
        }
      } catch (error) {
        console.error('Error loading attempt:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttempt();
  }, [attemptId]);

  // Auto-trigger share after a short delay (allows page to render)
  useEffect(() => {
    if (attempt && !hasShared && shareCardRef.current) {
      const timer = setTimeout(() => {
        handleShare();
      }, 1000); // 1 second delay to ensure card is rendered

      return () => clearTimeout(timer);
    }
  }, [attempt, hasShared]);

  const handleShare = async () => {
    if (!shareCardRef.current || !attempt) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#001122',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (blob) {
          const shared = await shareImage(
            blob,
            `I scored ${Math.round(attempt.score)} on the Pepso-Meter! 😊`,
            `Check out my Pepso Confidence Score! Can you beat ${Math.round(attempt.score)}?`
          );
          if (shared) {
            setHasShared(true);
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!shareCardRef.current || !attempt) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#001122',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          downloadImage(blob, `pepsodent-smile-${attempt.score}.png`);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Get face region from attempt if available (we'll need to store this)
  // For now, we'll use a default region
  const faceRegion: LuxandFaceRegion | undefined = attempt
    ? {
        x: 0,
        y: 0,
        w: 1080,
        h: 1080,
      }
    : undefined;

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
        <div ref={shareCardRef} className="flex justify-center bg-white rounded-2xl shadow-xl p-4">
          <div className="w-full max-w-[500px]">
            <ShareCard
              imageData={attempt.imageData || ''}
              score={attempt.score}
              firstName={attempt.firstName}
              faceRegion={faceRegion}
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
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? 'Preparing...' : hasShared ? 'Share Again' : 'Tap to Share'}
          </Button>
          <Button
            variant="accent"
            size="lg"
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? 'Generating...' : 'Download Image'}
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

