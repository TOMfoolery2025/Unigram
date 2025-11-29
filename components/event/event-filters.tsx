/** @format */

"use client";

import { useState } from "react";
import { Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventFilters as EventFiltersType, EventType, EventCategory } from "@/types/event";

interface EventFiltersProps {
  filters: EventFiltersType;
  onFiltersChange: (filters: EventFiltersType) => void;
}

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
  const [localFilters, setLocalFilters] = useState<EventFiltersType>(filters);

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    const newFilters = {
      ...localFilters,
      dateRange: {
        start: field === "start" ? value : localFilters.dateRange?.start || "",
        end: field === "end" ? value : localFilters.dateRange?.end || "",
      },
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleEventTypeChange = (eventType: EventType | undefined) => {
    const newFilters = {
      ...localFilters,
      eventType,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (searchQuery: string) => {
    const newFilters = {
      ...localFilters,
      searchQuery: searchQuery || undefined,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCategoryChange = (category: EventCategory | undefined) => {
    const newFilters = {
      ...localFilters,
      category,
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: EventFiltersType = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters =
    localFilters.dateRange?.start ||
    localFilters.dateRange?.end ||
    localFilters.eventType ||
    localFilters.category ||
    localFilters.searchQuery;

  return (
    <Card className='card-hover-glow border-border/60 bg-card/90'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Filter className='h-5 w-5 text-primary' />
              Filters
            </CardTitle>
            <CardDescription>Filter events by date, type, category, or search</CardDescription>
          </div>
          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClearFilters}
              className='text-muted-foreground hover:text-foreground'>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Search */}
        <div className='space-y-2'>
          <Label htmlFor='search' className='text-sm text-foreground'>
            Search
          </Label>
          <Input
            id='search'
            type='text'
            placeholder='Search events...'
            value={localFilters.searchQuery || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='bg-background/60 border-border/60'
          />
        </div>

        {/* Date Range */}
        <div className='space-y-2'>
          <Label className='text-sm text-foreground flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            Date Range
          </Label>
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <Label htmlFor='start-date' className='text-xs text-muted-foreground'>
                From
              </Label>
              <Input
                id='start-date'
                type='date'
                value={localFilters.dateRange?.start || ""}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
                className='bg-background/60 border-border/60'
              />
            </div>
            <div>
              <Label htmlFor='end-date' className='text-xs text-muted-foreground'>
                To
              </Label>
              <Input
                id='end-date'
                type='date'
                value={localFilters.dateRange?.end || ""}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                className='bg-background/60 border-border/60'
              />
            </div>
          </div>
        </div>

        {/* Event Type */}
        <div className='space-y-2'>
          <Label className='text-sm text-foreground'>Event Type</Label>
          <div className='flex gap-2'>
            <Button
              variant={
                localFilters.eventType === undefined ? "default" : "outline"
              }
              size='sm'
              onClick={() => handleEventTypeChange(undefined)}
              className={
                localFilters.eventType === undefined
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/60"
              }>
              All
            </Button>
            <Button
              variant={
                localFilters.eventType === "tum_native" ? "default" : "outline"
              }
              size='sm'
              onClick={() => handleEventTypeChange("tum_native")}
              className={
                localFilters.eventType === "tum_native"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/60"
              }>
              TUM Native
            </Button>
            <Button
              variant={
                localFilters.eventType === "external" ? "default" : "outline"
              }
              size='sm'
              onClick={() => handleEventTypeChange("external")}
              className={
                localFilters.eventType === "external"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/60"
              }>
              External
            </Button>
          </div>
        </div>

        {/* Category */}
        <div className='space-y-2'>
          <Label className='text-sm text-foreground'>Category</Label>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant={
                localFilters.category === undefined ? "default" : "outline"
              }
              size='sm'
              onClick={() => handleCategoryChange(undefined)}
              className={
                localFilters.category === undefined
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/60"
              }>
              All Categories
            </Button>
            <Button
              variant={
                localFilters.category === "social" ? "default" : "outline"
              }
              size='sm'
              onClick={() => handleCategoryChange("social")}
              className={
                localFilters.category === "social"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/60"
              }>
              Social
            </Button>
            <Button
              variant={
                localFilters.category === "academic" ? "default" : "outline"
              }
              size='sm'
              onClick={() => handleCategoryChange("academic")}
              className={
                localFilters.category === "academic"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/60"
              }>
              Academic
            </Button>
            <Button
              variant={
                localFilters.category === "sports" ? "default" : "outline"
              }
              size='sm'
              onClick={() => handleCategoryChange("sports")}
              className={
                localFilters.category === "sports"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/60"
              }>
              Sports
            </Button>
            <Button
              variant={
                localFilters.category === "cultural" ? "default" : "outline"
              }
              size='sm'
              onClick={() => handleCategoryChange("cultural")}
              className={
                localFilters.category === "cultural"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/60"
              }>
              Cultural
            </Button>
            <Button
              variant={
                localFilters.category === "other" ? "default" : "outline"
              }
              size='sm'
              onClick={() => handleCategoryChange("other")}
              className={
                localFilters.category === "other"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/60"
              }>
              Other
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
