'use client';

/**
 * Game Share Card Component
 * 
 * A gamified share card component designed for social media sharing.
 * Features a vibrant blue gradient background, circular user avatar,
 * prominent score display, and QR code for easy sharing.
 * 
 * Design Specifications:
 * - Fixed dimensions: 320px x 568px (9:16 aspect ratio)
 * - Blue gradient background with decorative elements
 * - Google Fonts: Fredoka (game text) and Poppins (labels)
 * - Circular avatar with glow effect
 * - QR code in bottom right corner
 * - Brand logo at top
 * 
 * @component
 */

import { QRCodeCanvas } from 'qrcode.react';
import { base64ToImage } from '@/lib/share/share-utils';
import { useEffect, useState } from 'react';

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
        BACKGROUND LAYER - Gradient & Decorations
        ============================================
      */}
      
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0052D4] via-[#4364F7] to-[#6FB1FC]" />

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

      {/* Subtle pattern overlay - Grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          zIndex: 2,
        }}
      />

      {/* 
        ============================================
        CONTENT LAYER - All interactive elements
        ============================================
      */}
      <div className="relative flex flex-col items-center justify-between h-full p-6" style={{ zIndex: 10 }}>
        
        {/* 
          TOP SECTION - Brand Logo
          ============================================
        */}
        <div className="flex-shrink-0 mt-4">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Pepsodent Logo"
              className="h-12 w-auto object-contain"
            />
          ) : (
            <div className="h-12 flex items-center justify-center">
              {/* Placeholder for logo - can be replaced with actual logo */}
              <span className="text-white font-bold text-xl font-[var(--font-poppins)]">
                Pepsodent
              </span>
            </div>
          )}
        </div>

        {/* 
          CENTER SECTION - Hero Content (Avatar + Score)
          ============================================
        */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          
          {/* Circular User Avatar with Glow Effect */}
          <div className="relative">
            {/* Glow effect behind avatar */}
            <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-125" />
            
            {/* Avatar container with white border */}
            <div className="relative w-[85px] h-[85px] rounded-full border-4 border-white overflow-hidden shadow-2xl">
              {isLoading ? (
                <div className="w-full h-full bg-gray-300 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Loading...</span>
                </div>
              ) : userImageUrl ? (
                <img
                  src={userImageUrl}
                  alt="User"
                  className="w-full h-full object-cover"
                  // Ensure face is always visible and clear
                  style={{ objectPosition: 'center center' }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <span className="text-white text-2xl">👤</span>
                </div>
              )}
            </div>
          </div>

          {/* Score Display Section */}
          <div className="text-center space-y-2">
            {/* "I Scored" label */}
            <p
              className="text-white text-sm font-medium font-[var(--font-poppins)]"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)',
              }}
            >
              I Scored
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
              {roundedScore}
            </div>

            {/* "on the Pepso-Meter" label */}
            <p
              className="text-white text-sm font-medium font-[var(--font-poppins)] mt-2"
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)',
              }}
            >
              on the Pepso-Meter
            </p>
          </div>
        </div>

        {/* 
          BOTTOM SECTION - Footer & QR Code
          ============================================
        */}
        <div className="flex-shrink-0 w-full flex items-end justify-between pb-4">
          
          {/* Left side - "Powered by" text */}
          <div className="flex-1">
            <p
              className="text-white/90 text-xs font-medium font-[var(--font-poppins)]"
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              Powered by Pepsometer
            </p>
          </div>

          {/* Right side - QR Code */}
          <div className="flex-shrink-0">
            {shareUrl ? (
              <div className="w-[50px] h-[50px] bg-white p-1 rounded">
                <QRCodeCanvas
                  value={shareUrl}
                  size={42}
                  level="H"
                  includeMargin={false}
                />
              </div>
            ) : qrCodeSrc ? (
              <div className="w-[50px] h-[50px] bg-white p-1 rounded">
                <img
                  src={qrCodeSrc}
                  alt="QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

