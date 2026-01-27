'use client';

/**
 * Game Share Card Component
 * 
 * A gamified share card component designed for social media sharing.
 * Features an SVG background image, circular user avatar,
 * prominent score display, and QR code for easy sharing.
 * 
 * Design Specifications:
 * - Fixed dimensions: 320px x 568px (9:16 aspect ratio)
 * - SVG background image (blob-scene-haikei.svg) with decorative elements
 * - Google Fonts: Fredoka (game text) and Poppins (labels)
 * - Circular avatar with glow effect
 * - QR code in bottom right corner
 * - Brand logo at top
 * 
 * @component
 */

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { Logo } from '../ui/Logo';
import { QRCodeCanvas } from 'qrcode.react';
import { base64ToImage } from '@/lib/share/share-utils';

interface GameShareCardProps {
  /** Base64 encoded user image data */
  userImageSrc: string;
  /** User's score (0-100) */
  score: number;
  /** QR code data URL or share URL */
  qrCodeSrc?: string;
  /** Share URL for QR code generation */
  shareUrl?: string;
  /** Brand logo image source (optional) */
  logoSrc?: string;
  /** Additional CSS classes */
  className?: string;
}

export function GameShareCard({
  userImageSrc,
  score,
  qrCodeSrc,
  shareUrl,
  logoSrc,
  className = '',
}: GameShareCardProps) {
  const [userImageUrl, setUserImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load user image from base64
  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        if (userImageSrc) {
          // If it's already a data URL, use it directly
          if (userImageSrc.startsWith('data:')) {
            setUserImageUrl(userImageSrc);
          } else {
            // Otherwise, convert base64 to data URL
            const img = await base64ToImage(userImageSrc);
            setUserImageUrl(img.src);
          }
        }
      } catch (error) {
        console.error('Error loading user image:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [userImageSrc]);

  // Calculate rounded score for display
  const roundedScore = Math.round(score);

  return (
    <div
      className={`
        relative
        w-[320px] 
        h-[568px]
        rounded-2xl
        shadow-2xl
        ring-8
        ring-white/10
        overflow-hidden
        ${className}
      `}
    >
      {/* 
        ============================================
        BACKGROUND LAYER - SVG Background & Decorations
        ============================================
      */}

      {/* SVG background image */}
      <Image
        src="/layered-waves-haikei.svg"
        alt=""
        fill
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
        priority
        unoptimized
      />

      {/* Decorative blob - Top Right */}
      <div
        className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
        style={{ zIndex: 1 }}
      />

      {/* Decorative blob - Bottom Left */}
      <div
        className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
        style={{ zIndex: 1 }}
      />

      {/* Logo */}
      <div className="absolute w-56 h-36 flex items-center justify-center rounded-br-full top-0 left-0 z-10">
        <Logo width={180} height={168} />
      </div>

      <div className='relative w-full h-full flex flex-col gap-4 justify-center items-center'>
        <div className='w-56 h-56 rounded-lg flex bg-red-600'>
          <div className="relative w-full h-full">
            {/* Glow effect behind avatar */}
            <div className="absolute inset-0 bg-white/30 rounded-lg blur-xl scale-105" />

            {/* Avatar container with white border */}
            <div className="relative w-full h-full rounded-lg border-4 border-white overflow-hidden shadow-2xl">
              {isLoading ? (
                <div className="w-full h-full bg-gray-300 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Loading...</span>
                </div>
              ) : userImageUrl ? (
                <Image
                  src={userImageUrl}
                  alt="User"
                  className="w-full h-full object-cover"
                  fill
                  style={{ objectPosition: 'center center' }}
                  unoptimized
                // sizes="85px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <span className="text-white text-2xl">👤</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-56 h-28 p-2 px-5 flex flex-col  bg-white border border-white rounded-lg ">
          <p
            className="text-black text-sm font-medium font-[var(--font-poppins)]"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)',
            }}
          >
            My Peosometer Score
          </p>
          {/* Large Score Number */}
          <div
            className="text-white font-bold font-[var(--font-fredoka)]"
            style={{
              fontSize: '64px',
              lineHeight: '1',
              textShadow: '0 4px 8px rgba(0,0,0,0.4), 0 0 16px rgba(0,0,0,0.3), 0 0 24px rgba(255,255,255,0.2)',
            }}
          >
            {roundedScore} <span className="text-black text-lg font-medium" style={{
              lineHeight: '1',
              textShadow: '0 4px 8px rgba(0,0,0,0.4), 0 0 16px rgba(0,0,0,0.3), 0 0 24px rgba(255,255,255,0.2)',
            }}>/ 100</span>
          </div>
        </div>
      </div>

      <div className='p-4 bg-white w-full absolute bottom-0 left-0 flex justify-center items-center'>
        <p className="text-black text-sm font-medium">
          Powered by the Pepsodent Smile Game
        </p>
      </div>

      {/* QR Code */}

      {/* <div className="absolute w-56 h-48 flex rounded-tl-full bottom-0 right-0">
        <div className="w-full h-full flex items-end justify-end">
          {shareUrl ? (
            <div className="w-36 h-36 p-1 rounded flex items-end justify-end">
              <QRCodeCanvas
                value={shareUrl}
                size={132}
                level="H"
                includeMargin={false}
              />
            </div>
          ) : qrCodeSrc ? (
            <div className="w-[50px] h-[50px] bg-white p-1 rounded">
              <Image
                src={qrCodeSrc}
                alt="QR Code"
                className="w-full h-full object-contain"
                fill
                sizes="50px"
                unoptimized
              />
            </div>
          ) : null}
        </div>
      </div> */}

    </div>
  );
}

