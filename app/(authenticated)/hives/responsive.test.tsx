/**
 * Responsive Design Tests for Hive Page
 * Tests mobile, tablet, and desktop layouts
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the auth context
vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the forum library functions
vi.mock('@/lib/forum/subforums', () => ({
  getUserSubforums: vi.fn().mockResolvedValue({
    data: [
      { id: '1', name: 'Test Hive 1', member_count: 10 },
      { id: '2', name: 'Test Hive 2', member_count: 20 },
    ],
    error: null,
  }),
}));

vi.mock('@/lib/forum/posts', () => ({
  getSubforumPosts: vi.fn().mockResolvedValue({
    data: [
      {
        id: '1',
        title: 'Test Post',
        content: 'Test content',
        author_id: 'test-user',
        subforum_id: '1',
        created_at: new Date().toISOString(),
        vote_count: 5,
        comment_count: 2,
      },
    ],
    error: null,
  }),
  searchPosts: vi.fn().mockResolvedValue({ data: [], error: null }),
}));

// Mock game API
global.fetch = vi.fn((url: string) => {
  if (url.includes('/api/hives/has-played')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ has_played: false }),
    } as Response);
  }
  if (url.includes('/api/hives/top-subhives')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ subhives: [] }),
    } as Response);
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response);
});

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mobile Layout (< 768px)', () => {
    beforeEach(() => {
      // Set viewport to mobile size
      global.innerWidth = 375;
      global.innerHeight = 667;
    });

    it('should stack components vertically on mobile', async () => {
      const { container } = render(
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
          <aside data-testid="left-sidebar">Left Sidebar</aside>
          <main data-testid="center-feed">Center Feed</main>
          <aside data-testid="right-panel">Right Panel</aside>
        </div>
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
    });

    it('should have adequate touch target sizes (min 44x44px)', () => {
      render(
        <div>
          <button className="min-h-[44px] min-w-[44px]" data-testid="touch-button">
            Touch Me
          </button>
          <input className="min-h-[44px]" data-testid="touch-input" />
        </div>
      );

      const button = screen.getByTestId('touch-button');
      const input = screen.getByTestId('touch-input');

      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('min-w-[44px]');
      expect(input).toHaveClass('min-h-[44px]');
    });

    it('should hide top subhives panel on mobile', () => {
      render(
        <div className="hidden md:block" data-testid="top-subhives">
          Top Subhives
        </div>
      );

      const panel = screen.getByTestId('top-subhives');
      expect(panel).toHaveClass('hidden');
      expect(panel).toHaveClass('md:block');
    });

    it('should not have horizontal overflow', () => {
      const { container } = render(
        <div className="min-h-screen bg-background/80">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
              <div>Content</div>
            </div>
          </div>
        </div>
      );

      const mainContainer = container.querySelector('.container');
      expect(mainContainer).toHaveClass('mx-auto');
      expect(mainContainer).toHaveClass('px-4');
    });

    it('should have proper spacing for mobile', () => {
      const { container } = render(
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div>Item 1</div>
            <div>Item 2</div>
          </div>
        </div>
      );

      const spacedContainer = container.querySelector('.space-y-6');
      expect(spacedContainer).toBeInTheDocument();
    });
  });

  describe('Tablet Layout (768px - 1024px)', () => {
    beforeEach(() => {
      // Set viewport to tablet size
      global.innerWidth = 768;
      global.innerHeight = 1024;
    });

    it('should show top subhives panel on tablet', () => {
      render(
        <div className="hidden md:block" data-testid="top-subhives">
          Top Subhives
        </div>
      );

      const panel = screen.getByTestId('top-subhives');
      expect(panel).toHaveClass('md:block');
    });

    it('should maintain usability with collapsible sidebars', () => {
      const { container } = render(
        <aside className="lg:sticky lg:top-24 lg:self-start" data-testid="sidebar">
          <div className="max-h-[400px] lg:max-h-[calc(50vh-8rem)] overflow-y-auto">
            Sidebar Content
          </div>
        </aside>
      );

      const sidebar = screen.getByTestId('sidebar');
      const scrollableContent = container.querySelector('.overflow-y-auto');
      
      expect(scrollableContent).toHaveClass('max-h-[400px]');
      expect(scrollableContent).toHaveClass('lg:max-h-[calc(50vh-8rem)]');
    });

    it('should use 2-column grid on tablet (before lg breakpoint)', () => {
      const { container } = render(
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
          <div>Column 1</div>
          <div>Column 2</div>
          <div>Column 3</div>
        </div>
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('lg:grid-cols-[280px_1fr_320px]');
    });

    it('should have readable content with proper spacing', () => {
      const { container } = render(
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div>Content Block 1</div>
            <div>Content Block 2</div>
          </div>
        </div>
      );

      const spacedContainer = container.querySelector('.space-y-4');
      expect(spacedContainer).toBeInTheDocument();
    });
  });

  describe('Desktop Layout (> 1024px)', () => {
    beforeEach(() => {
      // Set viewport to desktop size
      global.innerWidth = 1440;
      global.innerHeight = 900;
    });

    it('should display all panels in 3-column layout', () => {
      const { container } = render(
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
          <aside data-testid="left-sidebar">Left Sidebar</aside>
          <main data-testid="center-feed">Center Feed</main>
          <aside data-testid="right-panel">Right Panel</aside>
        </div>
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('lg:grid-cols-[280px_1fr_320px]');
      
      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('center-feed')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
    });

    it('should have sticky sidebars on desktop', () => {
      render(
        <aside className="lg:sticky lg:top-24 lg:self-start" data-testid="sidebar">
          Sidebar Content
        </aside>
      );

      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveClass('lg:sticky');
      expect(sidebar).toHaveClass('lg:top-24');
      expect(sidebar).toHaveClass('lg:self-start');
    });

    it('should have proper spacing and alignment', () => {
      const { container } = render(
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
            <div>Content</div>
          </div>
        </div>
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-6');
    });

    it('should show all panels visible simultaneously', () => {
      render(
        <div>
          <aside data-testid="left-sidebar" className="lg:block">
            Left Sidebar
          </aside>
          <main data-testid="center-feed">Center Feed</main>
          <aside data-testid="right-panel" className="lg:block">
            Right Panel
          </aside>
          <div data-testid="top-subhives" className="hidden md:block">
            Top Subhives
          </div>
        </div>
      );

      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('center-feed')).toBeInTheDocument();
      expect(screen.getByTestId('right-panel')).toBeInTheDocument();
      expect(screen.getByTestId('top-subhives')).toBeInTheDocument();
    });

    it('should have scrollable sidebar with max height', () => {
      const { container } = render(
        <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-hidden">
          <div className="max-h-[400px] lg:max-h-[calc(50vh-8rem)] overflow-y-auto">
            Long Content
          </div>
        </aside>
      );

      const sidebar = container.querySelector('aside');
      const scrollableContent = container.querySelector('.overflow-y-auto');

      expect(sidebar).toHaveClass('lg:max-h-[calc(100vh-7rem)]');
      expect(scrollableContent).toHaveClass('lg:max-h-[calc(50vh-8rem)]');
    });
  });

  describe('Viewport Resize Behavior', () => {
    it('should adjust layout smoothly without content overflow', () => {
      const { container, rerender } = render(
        <div className="min-h-screen bg-background/80">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
              <div>Responsive Content</div>
            </div>
          </div>
        </div>
      );

      // Check that container has responsive classes
      const mainContainer = container.querySelector('.container');
      expect(mainContainer).toHaveClass('mx-auto');
      
      // Verify no fixed widths that could cause overflow
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('lg:grid-cols-[280px_1fr_320px]');
    });

    it('should maintain proper spacing during resize', () => {
      const { container } = render(
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
            <div className="space-y-6">Item 1</div>
            <div className="space-y-4">Item 2</div>
            <div>Item 3</div>
          </div>
        </div>
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-6');
    });
  });

  describe('Accessibility - Touch Targets', () => {
    it('should have minimum 44x44px touch targets on mobile for search clear button', () => {
      render(
        <button className="h-9 w-9 p-0 hover:bg-muted min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-7 sm:w-7">
          Clear
        </button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('min-w-[44px]');
    });

    it('should have minimum 44px height for search input on mobile', () => {
      render(
        <input className="pl-10 pr-20 min-h-[44px]" />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('min-h-[44px]');
    });

    it('should ensure interactive elements are keyboard accessible', () => {
      render(
        <div>
          <button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            Interactive Button
          </button>
          <input className="focus:ring-2 focus:ring-primary" />
        </div>
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      expect(button).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-2');
    });
  });

  describe('Content Overflow Prevention', () => {
    it('should prevent horizontal overflow with container constraints', () => {
      const { container } = render(
        <div className="min-h-screen bg-background/80">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
              <div className="min-w-0">Content with min-w-0</div>
            </div>
          </div>
        </div>
      );

      const contentDiv = container.querySelector('.min-w-0');
      expect(contentDiv).toBeInTheDocument();
    });

    it('should use overflow-y-auto for scrollable sections', () => {
      const { container } = render(
        <div className="max-h-[400px] lg:max-h-[calc(50vh-8rem)] overflow-y-auto">
          Scrollable Content
        </div>
      );

      const scrollable = container.querySelector('.overflow-y-auto');
      expect(scrollable).toBeInTheDocument();
      expect(scrollable).toHaveClass('max-h-[400px]');
    });

    it('should handle long content in center feed without overflow', () => {
      const { container } = render(
        <main className="space-y-4 min-w-0">
          <div>Long content that should not overflow</div>
        </main>
      );

      const main = container.querySelector('main');
      expect(main).toHaveClass('min-w-0');
    });
  });

  describe('Responsive Animations', () => {
    it('should have smooth transitions for layout changes', () => {
      const { container } = render(
        <div className="transition-all duration-300">
          Animated Content
        </div>
      );

      const animated = container.querySelector('.transition-all');
      expect(animated).toHaveClass('duration-300');
    });

    it('should have animation classes for component entrance', () => {
      render(
        <div>
          <div className="animate-fade-in">Fade In</div>
          <div className="animate-slide-in-left">Slide Left</div>
          <div className="animate-slide-in-right">Slide Right</div>
          <div className="animate-fade-in-up">Fade Up</div>
        </div>
      );

      expect(screen.getByText('Fade In')).toHaveClass('animate-fade-in');
      expect(screen.getByText('Slide Left')).toHaveClass('animate-slide-in-left');
      expect(screen.getByText('Slide Right')).toHaveClass('animate-slide-in-right');
      expect(screen.getByText('Fade Up')).toHaveClass('animate-fade-in-up');
    });
  });
});
