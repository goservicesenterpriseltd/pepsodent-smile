'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { ShareModal } from '@/components/share/ShareModal';
import type { SmileAttempt } from '@/types/leaderboard';
import { appConfig } from '@/lib/config/app-config';
import { base64ToDataUrl } from '@/lib/image/image-storage';
import { getAllAttempts } from '@/lib/persistence/indexeddb';
import { getAttemptsForIdentity } from '@/lib/leaderboard/identity';
import { leaderboardStore } from '@/stores/LeaderboardStore';
import { observer } from 'mobx-react-lite';
import { toastStore } from '@/stores/ToastStore';
import { userStore } from '@/stores/UserStore';

const REFRESH_INTERVAL = appConfig.leaderboardRefreshIntervalMs;

export default observer(function LeaderboardPage() {
  const [autoScroll, setAutoScroll] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<SmileAttempt | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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

  /**
   * Get the best attempt for a leaderboard entry
   * Finds the attempt with the highest score for the given user
   */
  const getBestAttempt = async (entry: typeof leaderboardStore.leaderboard[0]): Promise<SmileAttempt | null> => {
    try {
      const allAttempts = await getAllAttempts();
      
      // Match by email (identity matching will find all attempts for this user)
      const userAttempts = getAttemptsForIdentity(allAttempts, {
        email: entry.email,
      });
      
      if (userAttempts.length === 0) {
        console.warn(`No attempts found for user: ${entry.email}`);
        return null;
      }

      // Find the attempt with the highest score (best attempt)
      // This matches the leaderboard's highestScore display
      const bestAttempt = userAttempts.reduce((best, current) => {
        return current.score > best.score ? current : best;
      });

      return bestAttempt;
    } catch (error) {
      console.error('Error getting best attempt:', error);
      return null;
    }
  };

  /**
   * Handle share button click
   * Opens the ShareModal with the best attempt for this user
   */
  const handleShare = async (entry: typeof leaderboardStore.leaderboard[0]) => {
    try {
      const bestAttempt = await getBestAttempt(entry);
      
      if (!bestAttempt) {
        toastStore.error('Unable to generate share link. No attempt found.');
        return;
      }

      if (!bestAttempt.remoteId) {
        toastStore.error('Unable to generate share link. This score has not been synced yet.');
        return;
      }

      // Set the attempt and open the modal
      setSelectedAttempt(bestAttempt);
      setIsShareModalOpen(true);
    } catch (error) {
      console.error('Error sharing:', error);
      toastStore.error('Failed to open share modal.');
    }
  };

  /**
   * Handle closing the share modal
   */
  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setSelectedAttempt(null);
  };

  // Show loading state during SSR or initial client load
  if (!isMounted || (leaderboardStore.isLoading && leaderboardStore.leaderboard.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative">
        <div className="absolute top-4 left-4 w-32 h-24 z-10">
          <Logo width={128} height={96} />
        </div>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (leaderboardStore.leaderboard.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4 relative">
        <div className="absolute top-4 left-4 w-32 h-24 z-10">
          <Logo width={128} height={96} />
        </div>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-black p-8 text-center space-y-6">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-black">No Scores Yet!</h1>
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
    <div className="min-h-screen bg-black p-4 relative">
      {/* Logo Top Right */}
      <div className="absolute top-4 left-4 w-32 h-24 z-10">
        <Logo width={128} height={96} />
      </div>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-8">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🏆 Leaderboard
          </h1>
          <p className="text-white/80 text-lg mb-4">
          The Pepso-Meter Hall of Smiles
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
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-h-[600px] overflow-y-auto border border-white/20"
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
                  className={`bg-white rounded-lg p-4 flex items-center gap-4 shadow-md hover:shadow-lg transition-all border border-black/10 ${
                    isCurrentUser ? 'ring-2 ring-black bg-gray-50' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="text-2xl font-bold text-black w-12 text-center flex-shrink-0">
                    {getRankEmoji(entry.rank)}
                  </div>

                  {/* Image */}
                  {imageUrl ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-black">
                      <img
                        src={imageUrl}
                        alt={`${entry.firstName} ${entry.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 border-2 border-black">
                      {entry.firstName.charAt(0)}{entry.lastName.charAt(0)}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-black text-lg truncate">
                      {entry.firstName} {entry.lastName}
                      {isCurrentUser && (
                        <span className="ml-2 text-sm text-black/70">(You)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.attemptCount} attempt{entry.attemptCount !== 1 ? 's' : ''} • 
                      Avg: {Math.round(entry.averageScore)} • 
                      Best: {Math.round(entry.highestScore)}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0 mr-2">
                    <div className="text-2xl font-bold text-black">
                      {Math.round(displayScore)}
                    </div>
                    <div className="text-xs text-gray-500">score</div>
                  </div>

                  {/* Share Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleShare(entry)}
                      className="w-10 h-10 flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
                      title="Share this player's score"
                      aria-label="Share score"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                    </button>
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

      {/* Share Modal */}
      {selectedAttempt && (
        <ShareModal
          attempt={selectedAttempt}
          remoteId={selectedAttempt.remoteId!}
          isOpen={isShareModalOpen}
          onClose={handleCloseShareModal}
        />
      )}
    </div>
  );
});

