"use client";

import { useState } from 'react';
import { WikiHome, WikiArticleList, WikiArticle } from '@/components/wiki';

type ViewMode = 'home' | 'category' | 'article';

interface ViewState {
  mode: ViewMode;
  categoryName?: string;
  articleSlug?: string;
}

export default function WikiPage() {
  const [viewState, setViewState] = useState<ViewState>({ mode: 'home' });

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

  return (
    <main className="min-h-screen p-8 bg-background">
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
    </main>
  );
}
