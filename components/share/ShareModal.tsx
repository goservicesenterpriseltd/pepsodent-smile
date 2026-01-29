'use client';

import { captureElementToPngBlob, downloadImage, getShareUrl, shareImage } from '@/lib/share/share-utils';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { GameShareCard } from './GameShareCard';
import type { LuxandFaceRegion } from '@/types/luxand-api';
import { QRCodeCanvas } from 'qrcode.react';
import type { SmileAttempt } from '@/types/leaderboard';

interface ShareModalProps {
  attempt: SmileAttempt;
  /** Backend remote ID from Pepsometer API (used for cross-device sharing) */
  remoteId: string;
  faceRegion?: LuxandFaceRegion;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ attempt, remoteId, faceRegion: _faceRegion, isOpen, onClose }: ShareModalProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  // Use backend remote ID for share URLs (works across devices)
  const shareUrl = getShareUrl(remoteId);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDownloadImage = async () => {
    if (!shareCardRef.current) return;


    setIsGeneratingImage(true);

    try {
      const blob = await captureElementToPngBlob(shareCardRef.current);

      if (blob) {
        downloadImage(blob, `pepsodent-smile-${attempt.score}.png`);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;

    setIsGeneratingImage(true);

    try {
      const title = `I scored ${Math.round(attempt.score)} on the Pepso-Meter! 😊`;
      const text = `Check out my Pepso Confidence Score! Can you beat ${Math.round(attempt.score)}?`;

      const blob = await captureElementToPngBlob(shareCardRef.current);

      if (blob) {
        const shared = await shareImage(blob, title, text, shareUrl);
        if (shared) {
          setIsGeneratingImage(false);
          return;
        }
      }

      if (navigator.share) {
        await navigator.share({
          title: `I scored ${Math.round(attempt.score)} on the Pepsometer! 😊`,
          text: `Check out my Pepso Confidence Score! Can you beat ${Math.round(attempt.score)}?`,
          url: shareUrl,
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error generating share image:', error);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[#003366] mb-6 text-center">
            Share Your Pepsometer Confidence Score!
          </h2>

          {/* Share Card */}
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-[500px] flex justify-center">
              <GameShareCard
                ref={shareCardRef}
                userImageSrc={attempt.imageData || ''}
                score={attempt.score}
                qrCodeSrc={shareUrl}
                shareUrl={shareUrl}
                // logoSrc={'/pepsodent-logo.png'}
                className="w-full"
              />
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center mb-6">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Scan to share on any device
            </p>
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <QRCodeCanvas
                value={shareUrl}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center max-w-xs">
              Scan this QR code to open your share page and share to social media
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 hidden">
            <Button
              variant="primary"
              size="lg"
              onClick={handleShare}
              disabled={isGeneratingImage}
              className="flex-1"
            >
              {isGeneratingImage ? 'Preparing...' : 'Share Now'}
            </Button>
            <Button
              variant="accent"
              size="lg"
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="flex-1"
            >
              {isGeneratingImage ? 'Generating...' : 'Download Image'}
            </Button>
          </div>

          {/* Share URL (for manual copy) */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Share Link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                aria-label="Share link URL"
                className="flex-1 text-xs p-2 border rounded bg-white"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                }}
                className="px-3 py-2 text-xs bg-[#003366] text-white rounded hover:bg-[#004d99] transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

