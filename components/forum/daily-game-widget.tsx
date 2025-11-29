/**
 * Daily Game Widget Component
 * Displays daily puzzle game or leaderboard based on play status
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 * Performance: Uses dynamic import for code splitting of game component
 */

'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { getTodaysWord, formatGameDate } from '@/lib/game';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Calendar } from 'lucide-react';
import type { LeaderboardEntry, HasPlayedResponse } from '@/types/game';

// Lazy load the game component for code splitting
const WordPuzzleGame = lazy(() => 
  import('./word-puzzle-game').then(module => ({ default: module.WordPuzzleGame }))
);

interface DailyGameWidgetProps {
  userId: string;
  onScoreSubmit?: (score: number) => void;
}

export function DailyGameWidget({ userId, onScoreSubmit }: DailyGameWidgetProps) {
  const [hasPlayed, setHasPlayed] = useState<boolean | null>(null);
  const [userScore, setUserScore] = useState<number | undefined>();
  const [userRank, setUserRank] = useState<number | undefined>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todaysWord = getTodaysWord();
  const gameDate = formatGameDate();

  // Check if user has played today
  useEffect(() => {
    checkPlayStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const checkPlayStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/hives/has-played?date=${gameDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to check play status');
      }

      const data: HasPlayedResponse = await response.json();
      setHasPlayed(data.has_played);
      setUserScore(data.score);
      setUserRank(data.rank);

      // If user has played, fetch leaderboard
      if (data.has_played) {
        await fetchLeaderboard();
      }
    } catch (err: any) {
      console.error('Error checking play status:', err);
      setError(err.message || 'Failed to load game status');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/hives/leaderboard?date=${gameDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      // Don't set error here, just log it
    }
  };

  const handleGameComplete = async (score: number, attempts: number) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/hives/game-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score,
          game_date: gameDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit score');
      }

      const data = await response.json();
      
      // Update state
      setHasPlayed(true);
      setUserScore(score);
      setUserRank(data.rank);

      // Fetch updated leaderboard
      await fetchLeaderboard();

      // Call optional callback
      if (onScoreSubmit) {
        onScoreSubmit(score);
      }
    } catch (err: any) {
      console.error('Error submitting score:', err);
      setError(err.message || 'Failed to submit score');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  if (error && hasPlayed === null) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={checkPlayStatus}
            className="text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 animate-slide-in-right animation-delay-200">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-xl font-bold">Daily Challenge</h2>
      </div>

      {!hasPlayed ? (
        <>
          <Suspense fallback={
            <div className="flex flex-col items-center space-y-4 p-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          }>
            <WordPuzzleGame
              targetWord={todaysWord}
              maxAttempts={6}
              onComplete={handleGameComplete}
            />
          </Suspense>
          {isSubmitting && (
            <p className="text-sm text-gray-600 text-center mt-4">
              Submitting your score...
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 text-center mt-4">{error}</p>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* User's score */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg transition-all duration-300 hover:shadow-md animate-fade-in">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Your Score Today
            </p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {userScore}
              </p>
              {userRank && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm">Rank #{userRank}</span>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Today&apos;s Leaderboard
            </h3>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:shadow-md animate-slide-in-up stagger-${Math.min(index + 1, 5)} ${
                      entry.user_id === userId
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold ${
                          entry.rank === 1
                            ? 'text-yellow-600'
                            : entry.rank === 2
                            ? 'text-gray-400'
                            : entry.rank === 3
                            ? 'text-orange-600'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        #{entry.rank}
                      </span>
                      <span className="font-medium">{entry.display_name}</span>
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                No scores yet today. Be the first!
              </p>
            )}
          </div>

          {/* Come back tomorrow message */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center pt-2">
            Come back tomorrow for a new challenge!
          </p>
        </div>
      )}
    </Card>
  );
}
