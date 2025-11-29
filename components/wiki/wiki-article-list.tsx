/** @format */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { HygraphWikiArticle } from "@/types/hygraph";

interface WikiArticleListProps {
  category: string;
  onBack?: () => void;
  onArticleSelect?: (slug: string) => void;
}

export function WikiArticleList({ 
  category, 
  onBack, 
  onArticleSelect
}: WikiArticleListProps) {
  const [articles, setArticles] = useState<HygraphWikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wiki/category/${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      
      const data = await response.json();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (slug: string) => {
    if (onArticleSelect) {
      onArticleSelect(slug);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold capitalize">{category}</h2>
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold capitalize">{category}</h2>
            <p className="text-muted-foreground">Error loading articles</p>
          </div>
        </div>
        
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error: {error}</p>
            <Button onClick={loadArticles} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} className="w-full sm:w-auto h-11 md:h-9 border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back</span>
          </Button>
        )}
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-white capitalize">{category}</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {articles.length === 0 
              ? "No articles in this category"
              : `${articles.length} article${articles.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <Card>
          <CardContent className="pt-4 md:pt-6 text-center">
            <BookOpen className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">No Articles Found</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              No articles available in the &quot;{category}&quot; category.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {articles.map((article) => (
            <Card 
              key={article.id}
              className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98] hover:border-blue-500/50"
              onClick={() => handleArticleClick(article.slug)}
            >
              <CardHeader className="pb-3 px-4 md:px-6">
                <CardTitle className="text-base md:text-xl">{article.title}</CardTitle>
                <CardDescription className="mt-1 text-xs md:text-sm">
                  Updated {new Date(article.updatedAt).toLocaleDateString()}
                  {article.publishedAt && (
                    <span> • Published {new Date(article.publishedAt).toLocaleDateString()}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 px-4 md:px-6 pb-4 md:pb-6">
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-3">
                  {article.content.substring(0, 200)}
                  {article.content.length > 200 ? '...' : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}