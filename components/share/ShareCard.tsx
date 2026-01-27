'use client';

import { useEffect, useRef, useState } from 'react';

import type { FaceLandmarkPoint } from '@/lib/share/face-landmarks';
import type { LuxandFaceRegion } from '@/types/luxand-api';
import { base64ToImage } from '@/lib/share/share-utils';
import { generateFaceLandmarks } from '@/lib/share/face-landmarks';

interface ShareCardProps {
  imageData: string; // Base64 image
  score: number;
  firstName: string;
  faceRegion?: LuxandFaceRegion;
  className?: string;
  onImageLoad?: () => void;
}

export function ShareCard({
  imageData,
  score,
  firstName,
  faceRegion,
  className = '',
  onImageLoad,
}: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [landmarks, setLandmarks] = useState<FaceLandmarkPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Instagram-friendly dimensions (1080x1080)
  const CARD_WIDTH = 1080;
  const CARD_HEIGHT = 1080;

  useEffect(() => {
    const loadImageAndGenerateLandmarks = async () => {
      try {
        setIsLoading(true);
        const img = await base64ToImage(imageData);
        imageRef.current = img;

        // Generate AI-style face landmarks based on face region
        // This creates a realistic facial recognition overlay pattern
        if (faceRegion) {
          const generatedLandmarks = generateFaceLandmarks(
            faceRegion,
            img.width || CARD_WIDTH,
            img.height || CARD_HEIGHT
          );
          setLandmarks(generatedLandmarks);
        } else {
          // If no face region, create a default centered face
          const defaultRegion = {
            x: CARD_WIDTH * 0.25,
            y: CARD_HEIGHT * 0.25,
            w: CARD_WIDTH * 0.5,
            h: CARD_HEIGHT * 0.5,
          };
          const generatedLandmarks = generateFaceLandmarks(
            defaultRegion,
            img.width || CARD_WIDTH,
            img.height || CARD_HEIGHT
          );
          setLandmarks(generatedLandmarks);
        }

        onImageLoad?.();
      } catch (error) {
        console.error('Error loading image for share card:', error);
        // Generate default landmarks as fallback
        if (faceRegion) {
          const synthetic = generateFaceLandmarks(faceRegion, CARD_WIDTH, CARD_HEIGHT);
          setLandmarks(synthetic);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (imageData) {
      loadImageAndGenerateLandmarks();
    }
  }, [imageData, faceRegion, onImageLoad]);

  // QR code is handled by the ShareModal component, not here

  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || isLoading || !imageData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    // Draw dark blue digital background with grid
    drawBackground(ctx, CARD_WIDTH, CARD_HEIGHT);

    // Draw semi-circular gauge behind face
    drawGauge(ctx, CARD_WIDTH, CARD_HEIGHT, score);

    // Draw user image (centered, circular)
    const img = imageRef.current;
    const imgAspect = img.width / img.height;
    const cardAspect = CARD_WIDTH / CARD_HEIGHT;

    let drawWidth = CARD_WIDTH * 0.7;
    let drawHeight = CARD_HEIGHT * 0.7;
    let drawX = (CARD_WIDTH - drawWidth) / 2;
    let drawY = (CARD_HEIGHT - drawHeight) / 2 - 50; // Slightly higher

    if (imgAspect > cardAspect) {
      drawHeight = drawWidth / imgAspect;
      drawY = (CARD_HEIGHT - drawHeight) / 2 - 50;
    } else {
      drawWidth = drawHeight * imgAspect;
      drawX = (CARD_WIDTH - drawWidth) / 2;
    }

    // Create circular clipping path
    ctx.save();
    const centerX = CARD_WIDTH / 2;
    const centerY = CARD_HEIGHT / 2 - 50;
    const radius = Math.min(drawWidth, drawHeight) / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Draw image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    // Draw AI overlay (facial recognition points)
    if (landmarks.length > 0) {
      drawFaceLandmarks(ctx, landmarks, centerX, centerY, radius, img.width, img.height, drawX, drawY, drawWidth, drawHeight);
    }

    // Draw score text
    drawScoreText(ctx, CARD_WIDTH, CARD_HEIGHT, score, firstName);

    // Draw footer
    drawFooter(ctx, CARD_WIDTH, CARD_HEIGHT);
  }, [landmarks, score, firstName, isLoading, imageData]);

  if (!imageData) {
    return (
      <div className={`relative ${className} bg-gray-200 rounded-lg p-8 flex items-center justify-center`}>
        <p className="text-gray-500">No image available for share card</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <p className="text-white">Generating share card...</p>
        </div>
      )}
    </div>
  );
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Dark blue gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#001122');
  gradient.addColorStop(0.5, '#003366');
  gradient.addColorStop(1, '#001122');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Grid pattern
  ctx.strokeStyle = 'rgba(0, 150, 255, 0.1)';
  ctx.lineWidth = 1;
  const gridSize = 50;

  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Glowing dots
  ctx.fillStyle = 'rgba(0, 150, 255, 0.3)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 2 + Math.random() * 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGauge(ctx: CanvasRenderingContext2D, width: number, height: number, score: number) {
  const centerX = width / 2;
  const centerY = height / 2 - 50;
  const radius = width * 0.35;
  const startAngle = Math.PI; // Start from left (180 degrees)
  const endAngle = 0; // End at right (0 degrees)
  const scoreAngle = startAngle - (score / 100) * Math.PI;

  // Draw semi-circle gauge background
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle, true);
  ctx.lineWidth = 40;
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
  ctx.stroke();

  // Draw score arc with gradient
  const gradient = ctx.createLinearGradient(
    centerX - radius,
    centerY,
    centerX + radius,
    centerY
  );
  gradient.addColorStop(0, '#ff0000'); // Red for low scores
  gradient.addColorStop(0.5, '#ffaa00'); // Orange
  gradient.addColorStop(1, '#00ff00'); // Green for high scores

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, scoreAngle, true);
  ctx.lineWidth = 40;
  ctx.strokeStyle = gradient;
  ctx.stroke();
}

function drawFaceLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarkPoint[],
  centerX: number,
  centerY: number,
  radius: number,
  imgWidth: number,
  imgHeight: number,
  drawX: number,
  drawY: number,
  drawWidth: number,
  drawHeight: number
) {
  ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';

  // Scale landmarks from image coordinates to canvas coordinates
  const scaleX = drawWidth / imgWidth;
  const scaleY = drawHeight / imgHeight;

  landmarks.forEach((point) => {
    const x = drawX + point.x * scaleX;
    const y = drawY + point.y * scaleY;

    // Only draw points within the circular face area
    const distanceFromCenter = Math.sqrt(
      Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
    );
    if (distanceFromCenter <= radius) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });

  // Draw connecting lines for key facial features
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  
  // Connect nearby points (simplified - in production you'd use proper face mesh indices)
  for (let i = 0; i < landmarks.length - 1; i++) {
    const point1 = landmarks[i];
    const point2 = landmarks[i + 1];
    const x1 = drawX + point1.x * scaleX;
    const y1 = drawY + point1.y * scaleY;
    const x2 = drawX + point2.x * scaleX;
    const y2 = drawY + point2.y * scaleY;

    const dist1 = Math.sqrt(Math.pow(x1 - centerX, 2) + Math.pow(y1 - centerY, 2));
    const dist2 = Math.sqrt(Math.pow(x2 - centerX, 2) + Math.pow(y2 - centerY, 2));
    const pointDist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    if (dist1 <= radius && dist2 <= radius && pointDist < 50) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}

function drawScoreText(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  score: number,
  firstName: string
) {
  // Large score display
  ctx.fillStyle = score >= 80 ? '#e60012' : score >= 60 ? '#004d99' : '#003366';
  ctx.font = 'bold 120px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.round(score).toString(), width / 2, height * 0.75);

  // Subtitle text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.fillText(`${firstName} scored ${Math.round(score)} on the Pepso-Meter 😊`, width / 2, height * 0.85);
}

function drawFooter(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Powered by Pepso-Meter AI', width / 2, height - 30);
}

