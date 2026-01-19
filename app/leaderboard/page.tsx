'use client';

import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@/components/ui/Button';
import { leaderboardStore } from '@/stores/LeaderboardStore';
import { userStore } from '@/stores/UserStore';
import Link from 'next/link';
import { base64ToDataUrl } from '@/lib/image/image-storage';
import { appConfig } from '@/lib/config/app-config';

const REFRESH_INTERVAL = appConfig.leaderboardRefreshIntervalMs;

export default observer(function LeaderboardPage() {
  const [autoScroll, setAutoScroll] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track client-side mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    leaderboardStore.loadFromStorage();
    setLastRefresh(new Date());
  }, []);

  // Auto-refresh leaderboard
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      console.log('Auto-refreshing leaderboard...');
      leaderboardStore.loadFromStorage();
      setLastRefresh(new Date());
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (!autoScroll || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    let scrollPosition = 0;
    const scrollSpeed = 1;

    scrollIntervalRef.current = setInterval(() => {
      scrollPosition += scrollSpeed;
      if (scrollPosition >= container.scrollHeight - container.clientHeight) {
        scrollPosition = 0;
      }
      container.scrollTop = scrollPosition;
    }, 50);

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [autoScroll, leaderboardStore.leaderboard]);

  const handleMouseEnter = () => setAutoScroll(false);
  const handleMouseLeave = () => setAutoScroll(true);

  const handleManualRefresh = () => {
    leaderboardStore.loadFromStorage();
    setLastRefresh(new Date());
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const currentUserEmail = userStore.user?.email;

  const formatLastRefresh = () => {
    if (!lastRefresh) return 'Just now';
    const secondsAgo = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    return `${minutesAgo}m ago`;
  };

  // Show loading state during SSR or initial client load
  if (!isMounted || (leaderboardStore.isLoading && leaderboardStore.leaderboard.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003366] via-[#004d99] to-[#002244]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (leaderboardStore.leaderboard.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003366] via-[#004d99] to-[#002244] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-[#003366]">No Scores Yet!</h1>
          <p className="text-gray-600">Be the first to play and claim the top spot!</p>
          <Link href="/">
            <Button variant="accent" size="lg" className="w-full">
              Start Playing! 🎮
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003366] via-[#004d99] to-[#002244] p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-8">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🏆 Leaderboard
          </h1>
          <p className="text-white/80 text-lg mb-4">
            Top Smile Champions
          </p>
          <div className="flex items-center justify-center gap-4 text-white/70 text-sm">
            <span className="flex items-center gap-2">
              {leaderboardStore.isLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              Last updated: {formatLastRefresh()}
            </span>
            <button
              onClick={handleManualRefresh}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={leaderboardStore.isLoading}
            >
              {leaderboardStore.isLoading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Scrollable List */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-h-[600px] overflow-y-auto"
        >
          <div className="space-y-3">
            {leaderboardStore.leaderboard.map((entry) => {
              const isCurrentUser = entry.email === currentUserEmail;
              const imageUrl = entry.imageData ? base64ToDataUrl(entry.imageData) : null;

              const displayScore = Number.isFinite(entry.highestScore)
                ? entry.highestScore
                : entry.totalScore;

              return (
                <div
                  key={entry.email}
                  className={`bg-white rounded-lg p-4 flex items-center gap-4 shadow-md hover:shadow-lg transition-all ${
                    isCurrentUser ? 'ring-2 ring-[#e60012] bg-[#fff5f5]' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="text-2xl font-bold text-[#003366] w-12 text-center flex-shrink-0">
                    {getRankEmoji(entry.rank)}
                  </div>

                  {/* Image */}
                  {imageUrl ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#003366]">
                      <img
                        src={imageUrl}
                        alt={`${entry.firstName} ${entry.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#003366] to-[#004d99] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 border-2 border-[#003366]">
                      {entry.firstName.charAt(0)}{entry.lastName.charAt(0)}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#003366] text-lg truncate">
                      {entry.firstName} {entry.lastName}
                      {isCurrentUser && (
                        <span className="ml-2 text-sm text-[#e60012]">(You)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.attemptCount} attempt{entry.attemptCount !== 1 ? 's' : ''} • 
                      Avg: {Math.round(entry.averageScore)} • 
                      Best: {Math.round(entry.highestScore)}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-[#e60012]">
                      {Math.round(displayScore)}
                    </div>
                    <div className="text-xs text-gray-500">score</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 pb-8">
          <Link href="/">
            <Button variant="accent" size="md">
              Play Game 🎮
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
              }
            }}
          >
            Scroll to Top ↑
          </Button>
        </div>
      </div>
    </div>
  );
});

