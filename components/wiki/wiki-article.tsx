/** @format */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { HygraphWikiArticle } from "@/types/hygraph";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface WikiArticleProps {
  slug: string;
  onBack?: () => void;
}

export function WikiArticle({ 
  slug, 
  onBack
}: WikiArticleProps) {
  const [article, setArticle] = useState<HygraphWikiArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/wiki/articles/${slug}`);
      
      if (response.status === 404) {
        setError('Article not found');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }
      
      const data = await response.json();
      setArticle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
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
        </div>
        
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
        
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error || 'Article not found'}
            </p>
            <Button onClick={loadArticle} variant="outline" className="mt-4">
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
      <div className="flex items-center gap-3 md:gap-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} className="h-11 md:h-9">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back</span>
          </Button>
        )}
      </div>

      {/* Article Content */}
      <Card>
        <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl mb-2 break-words">
                {article.title}
              </CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                <span>Created {new Date(article.createdAt).toLocaleDateString()}</span>
                <Separator orientation="vertical" className="h-4 hidden sm:block" />
                <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <Badge variant="secondary" className="self-start sm:ml-4 text-xs">
              {article.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <div className="mt-4 md:mt-6 prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Article Footer */}
      <Card>
        <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs md:text-sm text-muted-foreground gap-2">
            <div>
              Last updated on {new Date(article.updatedAt).toLocaleDateString()} 
              at {new Date(article.updatedAt).toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}