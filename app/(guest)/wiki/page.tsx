"use client";

import { useState } from 'react';
import { WikiHome, WikiArticleList, WikiArticle, ChatWidget } from '@/components/wiki';
import { useAuth } from '@/lib/auth';

type ViewMode = 'home' | 'category' | 'article';

interface ViewState {
  mode: ViewMode;
  categoryName?: string;
  articleSlug?: string;
}

export default function WikiPage() {
  const [viewState, setViewState] = useState<ViewState>({ mode: 'home' });
  const { user, isEmailVerified } = useAuth();

  const handleCategorySelect = (category: string) => {
    setViewState({ mode: 'category', categoryName: category });
  };

  const handleArticleSelect = (slug: string) => {
    setViewState({ mode: 'article', articleSlug: slug });
  };

  const handleBack = () => {
    if (viewState.mode === 'category') {
      setViewState({ mode: 'home' });
    } else if (viewState.mode === 'article') {
      if (viewState.categoryName) {
        setViewState({ mode: 'category', categoryName: viewState.categoryName });
      } else {
        setViewState({ mode: 'home' });
      }
    }
  };

  // Requirement 4.1, 4.3: Chat widget for authenticated users
  const isAuthenticated = !!user && isEmailVerified;

  return (
    <>
      {/* Wiki background - blue gradient */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_60%),radial-gradient(circle_at_bottom,_rgba(96,165,250,0.08),transparent_55%)]' />
      
    <main className="min-h-screen page-container py-6 md:py-8 bg-background/80">
      <div className="max-w-4xl mx-auto">
        {viewState.mode === 'home' && (
          <WikiHome
            onCategorySelect={handleCategorySelect}
          />
        )}

        {viewState.mode === 'category' && viewState.categoryName && (
          <WikiArticleList
            category={viewState.categoryName}
            onBack={handleBack}
            onArticleSelect={handleArticleSelect}
          />
        )}

        {viewState.mode === 'article' && viewState.articleSlug && (
          <WikiArticle
            slug={viewState.articleSlug}
            onBack={handleBack}
          />
        )}
      </div>

      {/* Requirement 4.1, 4.3, 4.4: Chat widget doesn't block wiki navigation */}
      {isAuthenticated && user && (
        <ChatWidget
          userId={user.id}
          isAuthenticated={isAuthenticated}
        />
      )}
    </main>
    </>
  );
}
