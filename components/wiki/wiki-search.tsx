/** @format */

"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X, BookOpen } from "lucide-react";
import { WikiSearchResult } from "@/types/hygraph";

interface WikiSearchProps {
  onClose?: () => void;
  onArticleSelect?: (articleId: string) => void;
}

export function WikiSearch({ onClose, onArticleSelect }: WikiSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WikiSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    // Handle empty query validation
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      // Call API route for search
      const response = await fetch(`/api/wiki/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const searchResults = await response.json();
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleArticleClick = (slug: string) => {
    // Navigate to article using slug
    window.location.href = `/wiki/${slug}`;
  };

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Search Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            inputMode="search"
            placeholder="Search wiki articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 w-full h-11 md:h-10"
            autoFocus
          />
        </div>
        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose} className="h-11 w-11 md:h-9 md:w-auto md:px-3 flex-shrink-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Close search</span>
          </Button>
        )}
      </div>

      {/* Search Results */}
      <div className="space-y-2 md:space-y-3">
        {loading && (
          <div className="text-center py-6 md:py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs md:text-sm text-muted-foreground mt-2">Searching...</p>
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-4 md:pt-6">
              <p className="text-destructive text-xs md:text-sm">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && hasSearched && results.length === 0 && (
          <Card>
            <CardContent className="pt-4 md:pt-6 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs md:text-sm text-muted-foreground">
                No articles found for &quot;{query}&quot;
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs md:text-sm text-muted-foreground px-1">
              Found {results.length} article{results.length !== 1 ? 's' : ''}
            </p>
            
            {results.map((article) => (
              <Card 
                key={article.id}
                className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                onClick={() => handleArticleClick(article.slug)}
              >
                <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base md:text-lg flex-1">
                      {highlightText(article.title, query)}
                    </CardTitle>
                    <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs">
                      {article.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-4 md:px-6 pb-4 md:pb-6">
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                    {highlightText(article.excerpt, query)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!hasSearched && (
          <Card>
            <CardContent className="pt-4 md:pt-6 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs md:text-sm text-muted-foreground">
                Enter a search term to find wiki articles
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}