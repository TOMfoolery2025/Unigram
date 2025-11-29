/** @format */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DailyGameWidget } from './daily-game-widget';

// Mock fetch
global.fetch = vi.fn();

describe('DailyGameWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() =>
      new Promise(() => {}) // Never resolves
    );

    render(<DailyGameWidget userId="test-user" />);
    
    // Should show skeleton loaders
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('renders game when user has not played', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ has_played: false }),
    });

    render(<DailyGameWidget userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('Daily Word Puzzle')).toBeTruthy();
    });
  });

  it('renders leaderboard when user has played', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          has_played: true,
          score: 85,
          rank: 3,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          leaderboard: [
            {
              user_id: 'user1',
              display_name: 'Player 1',
              avatar_url: null,
              score: 100,
              rank: 1,
            },
            {
              user_id: 'user2',
              display_name: 'Player 2',
              avatar_url: null,
              score: 90,
              rank: 2,
            },
            {
              user_id: 'test-user',
              display_name: 'Test User',
              avatar_url: null,
              score: 85,
              rank: 3,
            },
          ],
        }),
      });

    render(<DailyGameWidget userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('Your Score Today')).toBeTruthy();
      expect(screen.getByText('Rank #3')).toBeTruthy();
      expect(screen.getByText("Today's Leaderboard")).toBeTruthy();
    });
  });

  it('displays error message when API fails', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<DailyGameWidget userId="test-user" />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });
});
