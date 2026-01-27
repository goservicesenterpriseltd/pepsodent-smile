'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { GameShareCard } from './GameShareCard';
import type { LuxandFaceRegion } from '@/types/luxand-api';
import { QRCodeCanvas } from 'qrcode.react';
import type { SmileAttempt } from '@/types/leaderboard';
import { getShareUrl } from '@/lib/share/share-utils';
import html2canvas from 'html2canvas';

interface ShareModalProps {
  attempt: SmileAttempt;
  faceRegion?: LuxandFaceRegion;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to ensure explicit RGB color values for html2canvas compatibility
// html2canvas has issues with oklab/oklch colors, so we set explicit RGB values from computed styles
const prepareElementForCanvas = (element: HTMLElement) => {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  const elements: HTMLElement[] = [element];
  let node: Node | null = walker.nextNode();
  while (node) {
    if (node instanceof HTMLElement) {
      elements.push(node);
    }
    node = walker.nextNode();
  }

  const originalStyles: Map<HTMLElement, { [key: string]: string }> = new Map();

  elements.forEach((el) => {
    const computedStyle = window.getComputedStyle(el);
    const styleToRestore: { [key: string]: string } = {};

    // Set explicit RGB values for color properties to help html2canvas
    const colorProperties = [
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
    ];

    colorProperties.forEach((prop) => {
      const computedValue = computedStyle.getPropertyValue(prop);
      // Only set if we have a valid color value (not transparent/initial)
      if (computedValue && computedValue !== 'transparent' && computedValue !== 'rgba(0, 0, 0, 0)') {
        const currentStyle = el.style.getPropertyValue(prop);
        styleToRestore[prop] = currentStyle;
        // Set the computed RGB value explicitly
        el.style.setProperty(prop, computedValue, 'important');
      }
    });

    if (Object.keys(styleToRestore).length > 0) {
      originalStyles.set(el, styleToRestore);
    }
  });

  return () => {
    // Restore original styles
    originalStyles.forEach((styles, el) => {
      Object.entries(styles).forEach(([prop, value]) => {
        if (value) {
          el.style.setProperty(prop, value);
        } else {
          el.style.removeProperty(prop);
        }
      });
    });
  };
};

export function ShareModal({ attempt, faceRegion: _faceRegion, isOpen, onClose }: ShareModalProps) {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const shareUrl = getShareUrl(attempt.id);

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
    let restoreStyles: (() => void) | null = null;
    
    try {
      // Find the actual GameShareCard element (first child div)
      const cardElement = shareCardRef.current.querySelector('div > div') as HTMLElement;
      const targetElement = cardElement || shareCardRef.current;
      
      // Wait for all images to load
      const images = targetElement.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Continue even if image fails
              }
            })
        )
      );
      
      // Small delay to ensure rendering is complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Ensure explicit RGB color values for html2canvas compatibility
      restoreStyles = prepareElementForCanvas(targetElement);
      
      const canvas = await html2canvas(targetElement, {
        backgroundColor: null, // Transparent background
        scale: 2, // High quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `pepsodent-smile-${attempt.score}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      // Suppress oklab parsing errors - they're non-critical
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('oklab') && !errorMessage.includes('oklch')) {
        console.error('Error generating image:', error);
      }
    } finally {
      // Restore original styles
      if (restoreStyles) {
        restoreStyles();
      }
      setIsGeneratingImage(false);
    }
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;

    setIsGeneratingImage(true);
    let restoreStyles: (() => void) | null = null;
    
    try {
      // Find the actual GameShareCard element (first child div)
      const cardElement = shareCardRef.current.querySelector('div > div') as HTMLElement;
      const targetElement = cardElement || shareCardRef.current;
      
      // Wait for all images to load
      const images = targetElement.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Continue even if image fails
              }
            })
        )
      );
      
      // Small delay to ensure rendering is complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Ensure explicit RGB color values for html2canvas compatibility
      restoreStyles = prepareElementForCanvas(targetElement);
      
      const canvas = await html2canvas(targetElement, {
        backgroundColor: null, // Transparent background
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.share) {
          try {
            const file = new File([blob], 'pepsodent-smile-score.png', {
              type: 'image/png',
            });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: `I scored ${Math.round(attempt.score)} on the Pepso-Meter! 😊`,
                text: `Check out my Pepso Confidence Score! Can you beat ${Math.round(attempt.score)}?`,
                files: [file],
              });
            } else {
              // Fallback: share URL
              await navigator.share({
                title: `I scored ${Math.round(attempt.score)} on the Pepsometer! 😊`,
                text: `Check out my Pepso Confidence Score! Can you beat ${Math.round(attempt.score)}?`,
                url: shareUrl,
              });
            }
          } catch (error) {
            if ((error as Error).name !== 'AbortError') {
              console.error('Error sharing:', error);
            }
          }
        }
      }, 'image/png');
    } catch (error) {
      // Suppress oklab parsing errors - they're non-critical
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('oklab') && !errorMessage.includes('oklch')) {
        console.error('Error generating share image:', error);
      }
    } finally {
      // Restore original styles
      if (restoreStyles) {
        restoreStyles();
      }
      setIsGeneratingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
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
          <div ref={shareCardRef} className="mb-6 flex justify-center">
            <div className="w-full max-w-[500px]">
              <GameShareCard
                userImageSrc={attempt.imageData || ''}
                score={attempt.score}
                qrCodeSrc={shareUrl}
                shareUrl={shareUrl}
                // logoSrc={'/pepsodent-logo.png'}
                className="w-full"
              />
              {/* <ShareCard
                imageData={attempt.imageData || ''}
                score={attempt.score}
                firstName={attempt.firstName}
                faceRegion={faceRegion}
                className="w-full"
              /> */}
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

