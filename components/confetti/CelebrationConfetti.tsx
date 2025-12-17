'use client';

import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface CelebrationConfettiProps {
  score: number;
  trigger: boolean;
}

export function CelebrationConfetti({ score, trigger }: CelebrationConfettiProps) {
  useEffect(() => {
    if (!trigger) return;

    const duration = 3000;
    const end = Date.now() + duration;

    // Determine confetti intensity based on score
    let particleCount = 50;
    let spread = 60;

    if (score >= 90) {
      particleCount = 100;
      spread = 70;
    } else if (score >= 80) {
      particleCount = 75;
      spread = 65;
    } else if (score >= 70) {
      particleCount = 50;
      spread = 60;
    }

    const colors = ['#003366', '#e60012', '#ffffff', '#004d99', '#ff1a2e'];

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount,
        angle: 60,
        spread,
        origin: { x: 0 },
        colors,
      });

      confetti({
        particleCount,
        angle: 120,
        spread,
        origin: { x: 1 },
        colors,
      });
    }, 200);

    // Cleanup
    return () => clearInterval(interval);
  }, [trigger, score]);

  return null;
}

