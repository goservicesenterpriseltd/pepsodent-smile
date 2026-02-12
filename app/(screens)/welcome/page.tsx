'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { observer } from 'mobx-react-lite';
import { uiStore } from '@/stores/UIStore';

function WelcomeContent({ variant: initialVariant = 1 }: { variant?: number }) {
  const variant = initialVariant;

  const handleEnter = () => {
    uiStore.navigateTo('personalize');
  };

  // Variant 1: Vertical split with logo centered on border
  const renderVariant1 = () => (
    <div className="min-h-screen flex relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/bg_main.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />
      <div className="absolute z-20 w-24 h-16 sm:w-32 sm:h-24 top-4 left-4 sm:top-8 sm:left-8">
        <Logo width={128} height={96} />
      </div>
      <div className='absolute top-0 left-0 w-full h-full px-4 pt-20 pb-6 sm:p-4 flex items-center flex-col z-20 overflow-y-auto'>
        <div className="max-w-md w-full space-y-5 sm:space-y-8 text-center mt-2 sm:mt-10">
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold text-black leading-tight">
            Smile Game! 😊
          </h2>
          <p className="text-sm sm:text-base md:text-2xl text-black/80 leading-relaxed px-2 sm:px-0">
            Your smile has a score. Let&apos;s find it.
          </p>
          <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-3 sm:gap-6">
            <Button
              variant="accent"
              size="lg"
              onClick={handleEnter}
              className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-black text-white hover:bg-gray-800 shadow-2xl w-full sm:w-auto"
            >
              Let&apos;s Play! 🎮
            </Button>
            <Link href="/leaderboard" target='_blank' className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-white text-black hover:bg-gray-100 border-2 border-primary w-full sm:w-auto"
              >
                View Leaderboard 🏆
              </Button>
            </Link>
          </div>
        </div>
        <div className="max-w-lg w-full text-center mt-8 sm:mt-20 md:mt-32">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-white mb-4 sm:mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/20">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📸</div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-lg sm:text-xl">Capture</h3>
              <p className="text-sm text-white/80">Take your best smile photo</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/20">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">⭐</div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-lg sm:text-xl">Score</h3>
              <p className="text-sm text-white/80">Get your smile rating</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/20">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🏆</div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-lg sm:text-xl">Compete</h3>
              <p className="text-sm text-white/80">Climb the leaderboard</p>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:flex absolute z-10 inset-y-0 right-0 -top-26 bottom-36 items-center justify-center pointer-events-none">
        <Image
          src="/asset1.png"
          alt="Pepsodent Paste"
          width={460}
          height={328}
          className="w-full h-full object-contain opacity-80"
          priority
        />
      </div>
    </div>
  );

  // Variant 2: Horizontal split with logo on top border
  const renderVariant2 = () => (
    <div className="min-h-screen flex flex-col relative bg-white">
      {/* Top Side - Black */}
      <div className="flex-1 bg-black flex flex-col items-center justify-center p-6 md:p-8 relative">
        <div className="max-w-2xl w-full space-y-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white">
            Smile Game! 😊
          </h2>
          <p className="text-lg sm:text-xl md:text-3xl text-white/80 leading-relaxed">
            Your smile has a score. Let&apos;s find it.
          </p>
        </div>
      </div>

      {/* Border with Logo */}
      <div className="h-20 md:h-24 bg-white relative z-10 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.3),0_0_60px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-white"></div>
        <div className="relative z-20 w-40 h-28 md:w-48 md:h-36">
          <Image
            src="/logo.png"
            alt="Pepsodent Logo"
            width={192}
            height={144}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      </div>

      {/* Bottom Side - White */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-6 md:p-8 relative">
        <div className="max-w-2xl w-full space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-black/5 rounded-lg p-6 border-2 border-black/10">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="font-semibold mb-2 text-xl text-black">Capture</h3>
              <p className="text-sm text-black/70">Take your best smile photo</p>
            </div>
            <div className="bg-black/5 rounded-lg p-6 border-2 border-black/10">
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="font-semibold mb-2 text-xl text-black">Score</h3>
              <p className="text-sm text-black/70">Get your smile rating</p>
            </div>
            <div className="bg-black/5 rounded-lg p-6 border-2 border-black/10">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-semibold mb-2 text-xl text-black">Compete</h3>
              <p className="text-sm text-black/70">Climb the leaderboard</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="accent"
              size="lg"
              onClick={handleEnter}
              className="text-base sm:text-xl px-8 sm:px-12 py-4 sm:py-6 bg-black text-white hover:bg-gray-800 shadow-2xl"
            >
              Let&apos;s Play! 🎮
            </Button>
            <Link href="/leaderboard" target='_blank'>
              <Button
                variant="secondary"
                size="lg"
                  className="text-base sm:text-xl px-6 sm:px-8 py-4 sm:py-6 bg-white text-black hover:bg-gray-100 border-2 border-black"
              >
                View Leaderboard 🏆
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // Variant 3: Diagonal split with logo in corner
  const renderVariant3 = () => (
    <div className="min-h-screen flex relative bg-black overflow-hidden">
      {/* White Side - Top Left */}
      <div className="absolute top-0 left-0 w-full h-full bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}>
        <div className="h-full flex flex-col items-start justify-center p-6 md:p-16">
          <div className="max-w-md space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-black">
              Smile Game! 😊
            </h2>
            <p className="text-base sm:text-xl md:text-2xl text-black/80 leading-relaxed">
              Your smile has a score. Let&apos;s find it.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-6">
              <Button
                variant="accent"
                size="md"
                onClick={handleEnter}
                className="text-sm sm:text-md px-6 sm:px-12 py-4 sm:py-6 bg-black text-white hover:bg-gray-800 shadow-2xl"
              >
                Let&apos;s Play! 🎮
              </Button>
              <Link href="/leaderboard" target='_blank'>
                <Button
                  variant="secondary"
                  size="md"
                  className="text-sm sm:text-md px-6 sm:px-8 py-4 sm:py-6 bg-white text-black hover:bg-gray-100 border-2 border-primary"
                >
                  View Leaderboard 🏆
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Black Side - Bottom Right */}
      <div className="absolute top-0 left-0 w-full h-full bg-black" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}>
        <div className="h-full flex flex-col items-end justify-center p-6 md:p-12">
          <div className="max-w-2xl w-full text-right mt-32 md:mt-48">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-white mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 inline-block">
                <div className="text-4xl mb-3">📸</div>
                <h3 className="font-semibold mb-2 text-xl">Capture</h3>
                <p className="text-sm text-white/80">Take your best smile photo</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 inline-block">
                <div className="text-4xl mb-3">⭐</div>
                <h3 className="font-semibold mb-2 text-xl">Score</h3>
                <p className="text-sm text-white/80">Get your smile rating</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 inline-block">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="font-semibold mb-2 text-xl">Compete</h3>
                <p className="text-sm text-white/80">Climb the leaderboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute z-20 w-32 h-24 top-8 left-8">
        <Image
          src="/logo.png"
          alt="Pepsodent Logo"
          width={160}
          height={128}
          className="w-full h-full object-contain"
          priority
        />
      </div>
    </div>
  );

  // Render based on variant
  switch (variant) {
    case 1:
      return renderVariant1();
    case 2:
      return renderVariant2();
    case 3:
      return renderVariant3();
    default:
      return renderVariant1();
  }
}

export default observer(function WelcomePage() {
  // Read variant from URL on mount
  const [variant, setVariant] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const variantParam = params.get('variant');
      if (variantParam) {
        const parsedVariant = parseInt(variantParam, 10);
        if ([1, 2, 3].includes(parsedVariant)) {
          setVariant(parsedVariant);
        }
      }
    }
  }, []);

  const switchVariant = (newVariant: number) => {
    setVariant(newVariant);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', newVariant.toString());
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <>
      <WelcomeContent variant={variant} />
      {/* Variant Switcher - for testing/design review */}
      <div className="hidden md:flex fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border-2 border-black">
        <button
          onClick={() => switchVariant(1)}
          className={`px-4 py-2 rounded-full font-semibold transition-all ${variant === 1
            ? 'bg-black text-white'
            : 'bg-white text-black border-2 border-black hover:bg-gray-100'
            }`}
        >
          Design 1
        </button>
        <button
          onClick={() => switchVariant(2)}
          className={`px-4 py-2 rounded-full font-semibold transition-all ${variant === 2
            ? 'bg-black text-white'
            : 'bg-white text-black border-2 border-black hover:bg-gray-100'
            }`}
        >
          Design 2
        </button>
        <button
          onClick={() => switchVariant(3)}
          className={`px-4 py-2 rounded-full font-semibold transition-all ${variant === 3
            ? 'bg-black text-white'
            : 'bg-white text-black border-2 border-black hover:bg-gray-100'
            }`}
        >
          Design 3
        </button>
      </div>
    </>
  );
});

