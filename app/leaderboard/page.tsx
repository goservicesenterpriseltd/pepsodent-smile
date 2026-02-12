'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
import { locationStore } from '@/stores/LocationStore';
import { getPlayers, type ActivityData, type PlayerData } from '@/lib/api/pepsometer-api';

const REFRESH_INTERVAL = appConfig.leaderboardRefreshIntervalMs;

export default observer(function LeaderboardPage() {
  const [autoScroll, setAutoScroll] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<SmileAttempt | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [useRemoteAPI, setUseRemoteAPI] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedLocationId = locationStore.selected?.id;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load function that respects the toggle state
  const loadLeaderboard = useCallback(async () => {
    if (useRemoteAPI && selectedLocationId) {
      await leaderboardStore.loadFromRemoteAPI(selectedLocationId);
    } else {
      await leaderboardStore.loadFromStorage();
    }
    setLastRefresh(new Date());
  }, [selectedLocationId, useRemoteAPI]);

  // Track client-side mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    locationStore.hydrate();
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Auto-refresh leaderboard
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      console.log('Auto-refreshing leaderboard...');
      loadLeaderboard();
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [loadLeaderboard]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!autoScroll || !scrollContainerRef.current || searchQuery.trim().length > 0) return;

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
  }, [autoScroll, searchQuery]);

  const handleMouseEnter = () => setAutoScroll(false);
  const handleMouseLeave = () => setAutoScroll(true);

  const handleManualRefresh = () => {
    loadLeaderboard();
  };

  const handleToggleRemote = async () => {
    const newValue = !useRemoteAPI;
    setUseRemoteAPI(newValue);
    
    // Show warning if trying to use remote API without location
    if (newValue && !locationStore.selected?.id) {
      toastStore.warning('Please select a location first to load from remote API');
      setUseRemoteAPI(false);
      return;
    }
    
    // Load immediately when toggling
    if (newValue && locationStore.selected?.id) {
      await leaderboardStore.loadFromRemoteAPI(locationStore.selected.id);
    } else {
      await leaderboardStore.loadFromStorage();
    }
    setLastRefresh(new Date());
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const currentUserPhone = userStore.user?.phone;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredLeaderboard = leaderboardStore.leaderboard.filter((entry) => {
    if (!normalizedSearch) return true;
    const fullName = `${entry.firstName} ${entry.lastName}`.trim().toLowerCase();
    return (
      fullName.includes(normalizedSearch) ||
      entry.firstName.toLowerCase().includes(normalizedSearch) ||
      entry.lastName.toLowerCase().includes(normalizedSearch) ||
      entry.email.toLowerCase().includes(normalizedSearch)
    );
  });

  const formatLastRefresh = () => {
    if (!lastRefresh) return 'Just now';
    const secondsAgo = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    return `${minutesAgo}m ago`;
  };

  const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const toTimestamp = (...values: Array<unknown>): number => {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = new Date(value).getTime();
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }
    return Date.now();
  };

  const resolveEntryImageForShare = (entryImageData?: string): string | undefined => {
    if (!entryImageData) return undefined;
    if (entryImageData.startsWith('url:')) {
      return entryImageData.slice(4);
    }
    return entryImageData;
  };

  const pickBestRemoteActivity = (player: PlayerData): ActivityData | null => {
    if (!Array.isArray(player.activities) || player.activities.length === 0) {
      return null;
    }

    const withRemoteId = player.activities.filter((activity) => activity.id != null);
    if (withRemoteId.length === 0) {
      return null;
    }

    const sorted = [...withRemoteId].sort((a, b) => {
      const scoreA =
        toFiniteNumber(a.score) ??
        toFiniteNumber(a.total_score) ??
        toFiniteNumber(a.smile_score) ??
        0;
      const scoreB =
        toFiniteNumber(b.score) ??
        toFiniteNumber(b.total_score) ??
        toFiniteNumber(b.smile_score) ??
        0;

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      const timeA = toTimestamp(a.updated_at, a.created_at);
      const timeB = toTimestamp(b.updated_at, b.created_at);
      return timeB - timeA;
    });

    return sorted[0] ?? null;
  };

  const buildRemoteShareAttempt = (
    entry: typeof leaderboardStore.leaderboard[0],
    player: PlayerData
  ): SmileAttempt | null => {
    const bestActivity = pickBestRemoteActivity(player);
    if (!bestActivity || bestActivity.id == null) {
      return null;
    }

    const remoteId = String(bestActivity.id);
    const score =
      toFiniteNumber(bestActivity.score) ??
      toFiniteNumber(bestActivity.total_score) ??
      toFiniteNumber(bestActivity.smile_score) ??
      entry.highestScore;

    const imageData =
      (typeof bestActivity.image_url === 'string' && bestActivity.image_url) ||
      (typeof player.image_url === 'string' && player.image_url) ||
      resolveEntryImageForShare(entry.imageData);

    return {
      id: `remote-${player.id ?? entry.email}-${remoteId}`,
      email: entry.email,
      firstName: entry.firstName,
      lastName: entry.lastName,
      phone: player.phone_number ?? entry.email,
      gender: player.gender ?? 'unknown',
      score,
      timestamp: toTimestamp(bestActivity.updated_at, bestActivity.created_at, player.updated_at, entry.lastPlayed),
      imageData,
      remoteId,
    };
  };

  const findRemotePlayerForEntry = (
    entry: typeof leaderboardStore.leaderboard[0],
    players: PlayerData[]
  ): PlayerData | null => {
    const normalizedPhone = entry.email.trim().toLowerCase();
    const normalizedFirstName = entry.firstName.trim().toLowerCase();
    const normalizedLastName = entry.lastName.trim().toLowerCase();

    const byPhone = players.find((player) => (player.phone_number ?? '').trim().toLowerCase() === normalizedPhone);
    if (byPhone) return byPhone;

    const byEmail = players.find((player) => (player.email ?? '').trim().toLowerCase() === normalizedPhone);
    if (byEmail) return byEmail;

    return (
      players.find(
        (player) =>
          (player.first_name ?? '').trim().toLowerCase() === normalizedFirstName &&
          (player.last_name ?? '').trim().toLowerCase() === normalizedLastName
      ) ?? null
    );
  };

  /**
   * Get the best attempt for a leaderboard entry
   * Finds the attempt with the highest score for the given user
   * Note: When using remote API, entry.email contains phone number
   */
  const getBestAttempt = async (entry: typeof leaderboardStore.leaderboard[0]): Promise<SmileAttempt | null> => {
    try {
      if (useRemoteAPI) {
        if (!locationStore.selected?.id) {
          toastStore.warning('Please select a location first');
          return null;
        }

        const response = await getPlayers(locationStore.selected.id);
        if (!response.status || !Array.isArray(response.data)) {
          return null;
        }

        const player = findRemotePlayerForEntry(entry, response.data);
        if (!player) {
          console.warn(`No remote player found for entry: ${entry.email}`);
          return null;
        }

        const remoteAttempt = buildRemoteShareAttempt(entry, player);
        if (!remoteAttempt) {
          console.warn(`No shareable remote activity found for player: ${entry.email}`);
          return null;
        }

        return remoteAttempt;
      }

      const allAttempts = await getAllAttempts();
      
      // Match by phone (entry.email contains phone when from remote API, or email when from local)
      // Since we now use phone for identity, try to match by phone
      const userAttempts = getAttemptsForIdentity(allAttempts, {
        phone: entry.email, // entry.email may contain phone or email depending on source
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
      <div className="min-h-screen flex items-center justify-center bg-black relative p-3 sm:p-4">
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-24 h-16 sm:w-32 sm:h-24 z-10">
          <Logo width={128} height={96} />
        </div>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm sm:text-lg">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (leaderboardStore.leaderboard.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-3 sm:p-4 relative">
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-24 h-16 sm:w-32 sm:h-24 z-10">
          <Logo width={128} height={96} />
        </div>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-black p-5 sm:p-8 text-center space-y-5 sm:space-y-6 mt-12 sm:mt-0">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black">No Scores Yet!</h1>
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
    <div className="min-h-screen bg-black p-3 sm:p-4 relative">
      {/* Logo Top Right */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-24 h-16 sm:w-32 sm:h-24 z-10">
        <Logo width={128} height={96} />
      </div>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-12 sm:pt-0">
        {/* Header */}
        <div className="text-center pt-4 sm:pt-8">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            🏆 Leaderboard
          </h1>
          <p className="text-white/80 text-sm sm:text-lg mb-2">
          The Pepso-Meter Hall of Smiles
          </p>
          {useRemoteAPI && locationStore.selected && (
            <p className="text-blue-300 text-sm mb-4">
              📍 Loading from: {locationStore.selected.name}
            </p>
          )}
          {!useRemoteAPI && (
            <p className="text-white/60 text-sm mb-4">
              💾 Loading from local storage
            </p>
          )}
          <div className="flex items-center justify-center gap-2 sm:gap-4 text-white/70 text-xs sm:text-sm flex-wrap">
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
            <button
              onClick={handleToggleRemote}
              className={`px-3 py-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                useRemoteAPI
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white/70'
              }`}
              disabled={leaderboardStore.isLoading}
              title={useRemoteAPI ? 'Switch to local storage' : 'Switch to remote API'}
            >
              {useRemoteAPI ? '🌐 Remote' : '💾 Local'}
            </button>
          </div>
          <div className="mt-4 max-w-md mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or phone/email..."
              className="w-full px-4 py-2 rounded-full bg-white/90 text-black border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Search leaderboard"
            />
          </div>
        </div>

        {/* Scrollable List */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-6 max-h-[70vh] sm:max-h-[600px] overflow-y-auto border border-white/20"
        >
          <div className="space-y-3">
            {filteredLeaderboard.map((entry, index) => {
              // For remote API, entry.email contains phone; for local, it contains email
              // But we now use phone for identity, so check if entry.email matches current user's phone
              const isCurrentUser = entry.email === currentUserPhone;
              // Handle both base64 data and URLs
              let imageUrl: string | null = null;
              if (entry.imageData) {
                if (entry.imageData.startsWith('url:')) {
                  // It's a URL, use it directly
                  imageUrl = entry.imageData.substring(4);
                } else {
                  // It's base64, convert to data URL
                  imageUrl = base64ToDataUrl(entry.imageData);
                }
              }

              const displayScore = Number.isFinite(entry.highestScore)
                ? entry.highestScore
                : entry.totalScore;
              const entryKey =
                entry.email?.trim() ||
                `${entry.firstName}-${entry.lastName}-${entry.lastPlayed}-${entry.rank}-${index}`;

              return (
                <div
                  key={entryKey}
                  className={`bg-white rounded-lg p-2.5 sm:p-4 flex items-center gap-2 sm:gap-4 shadow-md hover:shadow-lg transition-all border border-black/10 ${
                    isCurrentUser ? 'ring-2 ring-black bg-gray-50' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="text-base sm:text-2xl font-bold text-black w-8 sm:w-12 text-center shrink-0">
                    {getRankEmoji(entry.rank)}
                  </div>

                  {/* Image */}
                  {imageUrl ? (
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 border-2 border-black">
                      <img
                        src={imageUrl}
                        alt={`${entry.firstName} ${entry.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-black flex items-center justify-center text-white text-base sm:text-2xl font-bold shrink-0 border-2 border-black">
                      {entry.firstName.charAt(0)}{entry.lastName.charAt(0)}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-black text-xs sm:text-lg truncate">
                      {entry.firstName} {entry.lastName}
                      {isCurrentUser && (
                        <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-black/70">(You)</span>
                      )}
                    </div>
                    <div className="text-[11px] sm:text-sm text-gray-600 leading-tight">
                      {entry.attemptCount} attempt{entry.attemptCount !== 1 ? 's' : ''} • 
                      Avg: {Math.round(entry.averageScore)} • 
                      Best: {Math.round(entry.highestScore)}
                    </div>
                  </div>

                  {/* Score + Share */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <div className="text-right">
                      <div className="text-base sm:text-2xl font-bold text-black leading-none">
                        {Math.round(displayScore)}
                      </div>
                      <div className="hidden sm:block text-xs text-gray-500">score</div>
                    </div>
                    <button
                      onClick={() => handleShare(entry)}
                      className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
                      title="Share this player's score"
                      aria-label="Share score"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5"
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
            {filteredLeaderboard.length === 0 && (
              <div className="bg-white/90 rounded-lg p-6 text-center text-black">
                No players found for &quot;{searchQuery.trim()}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pb-8">
          <Link href="/" className="w-full sm:w-auto">
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

