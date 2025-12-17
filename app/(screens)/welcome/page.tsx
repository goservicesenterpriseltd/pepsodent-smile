'use client';

import { observer } from 'mobx-react-lite';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { uiStore } from '@/stores/UIStore';

export default observer(function WelcomePage() {
  const handleEnter = () => {
    uiStore.navigateTo('personalize');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#003366] via-[#004d99] to-[#002244] p-4">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-2xl">
            Pepsodent
          </h1>
          <div className="w-64 h-2 bg-[#e60012] mx-auto rounded-full"></div>
        </div>

        {/* Welcome Message */}
        <div className="space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            Smile Game! 😊
          </h2>
          <p className="text-xl md:text-2xl text-white/90 max-w-lg mx-auto leading-relaxed">
            Show us your brightest smile and get an amazing score! 
            Compete with others and see where you rank on our leaderboard.
          </p>
        </div>

        {/* Enter Button */}
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="accent"
            size="lg"
            onClick={handleEnter}
            className="text-2xl px-12 py-6 shadow-2xl hover:shadow-[#e60012]/50"
          >
            Let's Play! 🎮
          </Button>
          <Link href="/leaderboard">
            <Button
              variant="secondary"
              size="lg"
              className="text-xl px-8 py-6 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20"
            >
              View Leaderboard 🏆
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-white/80">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl mb-2">📸</div>
            <h3 className="font-semibold mb-1">Capture</h3>
            <p className="text-sm">Take your best smile photo</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="font-semibold mb-1">Score</h3>
            <p className="text-sm">Get your smile rating</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-semibold mb-1">Compete</h3>
            <p className="text-sm">Climb the leaderboard</p>
          </div>
        </div>
      </div>
    </div>
  );
});

