/**
 * Example usage of DailyGameWidget component
 * This file demonstrates how to integrate the daily game widget into a page
 */

'use client';

import { DailyGameWidget } from './daily-game-widget';
import { useAuth } from '@/lib/auth/auth-provider';

export function DailyGameWidgetExample() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const handleScoreSubmit = (score: number) => {
    console.log('User submitted score:', score);
    // Optional: Show a toast notification or trigger other actions
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <DailyGameWidget 
        userId={user.id} 
        onScoreSubmit={handleScoreSubmit}
      />
    </div>
  );
}
