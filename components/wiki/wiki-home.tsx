/** @format */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Search } from "lucide-react";
import { WikiCategory } from "@/types/hygraph";
import { useAuth } from "@/lib/auth/auth-provider";
import { WikiSearch } from "./wiki-search";
import Link from "next/link";

interface WikiHomeProps {
  onCategorySelect?: (category: string) => void;
  onCreateArticle?: () => void;
  showCreateButton?: boolean;
}

export function WikiHome({ 
  onCategorySelect, 
  onCreateArticle, 
  showCreateButton = false 
}: WikiHomeProps) {
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/wiki/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories from Hygraph');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">
            TUM Community Wiki
          </h1>
          <p className="text-muted-foreground">
            Information for prospective and incoming TUM students
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          TUM Community Wiki
        </h1>
        <p className="text-muted-foreground mb-4">
          Information for prospective and incoming TUM students
        </p>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading wiki: {error}</p>
            <Button 
              onClick={loadCategories} 
              variant="outline" 
              className="mt-4"
            >
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
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
          TUM Community Wiki
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Information for prospective and incoming TUM students
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-between items-stretch sm:items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center justify-center gap-2 flex-1 sm:flex-initial h-11 md:h-9"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search Articles</span>
          </Button>
        </div>
        
        {showCreateButton && user?.is_admin && (
          <Button
            onClick={onCreateArticle}
            className="flex items-center justify-center gap-2 w-full sm:w-auto h-11 md:h-10"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Create Article</span>
          </Button>
        )}
      </div>

      {/* Search Component */}
      {showSearch && (
        <Card>
          <CardContent className="pt-6">
            <WikiSearch onClose={() => setShowSearch(false)} />
          </CardContent>
        </Card>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold mb-2">No Articles Yet</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              {user?.is_admin 
                ? "Create the first wiki article to get started."
                : "Wiki articles will appear here once they are created."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card 
              key={category.category}
              className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
              onClick={() => handleCategoryClick(category.category)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg md:text-xl">
                  <span className="capitalize">{category.category}</span>
                  <Badge variant="secondary" className="ml-2">
                    {category.articleCount}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm">
                  {category.articleCount === 1 
                    ? "1 article" 
                    : `${category.articleCount} articles`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Click to view articles</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Guest Access Notice */}
      {!user && (
        <Card className="border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/20">
          <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
            <p className="text-xs md:text-sm text-muted-foreground text-center leading-relaxed">
              <strong>Guest Access:</strong> You are viewing the wiki as a guest. 
              To access hives, clusters, and events, please{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                register with a TUM email address
              </Link>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}