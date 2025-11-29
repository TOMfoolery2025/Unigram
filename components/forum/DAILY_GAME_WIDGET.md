# Daily Game Widget

## Overview

The Daily Game Widget is a gamification feature for the Hive page that provides users with a daily word puzzle challenge. Users can play once per day, earn scores, and compete on a leaderboard.

## Components

### DailyGameWidget

Main component that orchestrates the game experience.

**Props:**
- `userId: string` - The authenticated user's ID
- `onScoreSubmit?: (score: number) => void` - Optional callback when score is submitted

**Features:**
- Checks if user has played today on mount
- Displays game interface if not played
- Displays leaderboard if already played
- Handles score submission and error states
- Shows user's rank and score

### WordPuzzleGame

The actual puzzle game component (Wordle-style word guessing game).

**Props:**
- `targetWord: string` - The word to guess
- `maxAttempts?: number` - Maximum number of attempts (default: 6)
- `onComplete: (score: number, attempts: number) => void` - Callback when game completes

**Scoring:**
- Score = 100 - (attempts - 1) * 15
- Minimum score: 10 points
- Failed games: 0 points

## Game Library

### Daily Word Generator

Located in `lib/game/daily-word.ts`

**Functions:**
- `getDailyWord(date?: Date): string` - Get word for specific date
- `getTodaysWord(): string` - Get today's word
- `formatGameDate(date?: Date): string` - Format date as YYYY-MM-DD

**Word List:**
- 50 tech-related 5-letter words
- Deterministic selection based on date
- Same word for all users on same day

## API Integration

The widget integrates with three API endpoints:

1. **GET /api/hives/has-played** - Check if user played today
2. **POST /api/hives/game-score** - Submit game score
3. **GET /api/hives/leaderboard** - Fetch daily leaderboard

## Usage Example

```tsx
import { DailyGameWidget } from '@/components/forum';
import { useAuth } from '@/lib/auth/auth-provider';

export function HivePage() {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Other content */}
      
      <div className="col-span-1">
        <DailyGameWidget 
          userId={user.id}
          onScoreSubmit={(score) => {
            console.log('Score submitted:', score);
          }}
        />
      </div>
    </div>
  );
}
```

## Testing

Tests are located in `components/forum/daily-game-widget.test.tsx`

Run tests:
```bash
npm test -- components/forum/daily-game-widget.test.tsx
```

## Requirements Satisfied

- **4.1**: Daily game panel displays in UI
- **4.2**: Game interface shown when not played
- **4.3**: Score calculation and recording
- **4.4**: Leaderboard shown when already played
- **4.5**: Top scores displayed with ranks
- **4.6**: Daily reset logic (handled by date-based queries)
- **4.7**: Third-party puzzle library (custom implementation)

## Future Enhancements

- Multiple game types (Sudoku, trivia, etc.)
- Weekly/monthly leaderboards
- Achievement badges
- Streak tracking
- Social sharing of scores
