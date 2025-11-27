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
import { EventFilters as EventFiltersType, EventType } from "@/types/event";

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

  const handleClearFilters = () => {
    const emptyFilters: EventFiltersType = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters =
    localFilters.dateRange?.start ||
    localFilters.dateRange?.end ||
    localFilters.eventType ||
    localFilters.searchQuery;

  return (
    <Card className='bg-gray-800 border-gray-700'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Filter className='h-5 w-5 text-violet-400' />
              Filters
            </CardTitle>
            <CardDescription>Filter events by date, type, or search</CardDescription>
          </div>
          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClearFilters}
              className='text-gray-400 hover:text-white'>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Search */}
        <div className='space-y-2'>
          <Label htmlFor='search' className='text-sm text-gray-300'>
            Search
          </Label>
          <Input
            id='search'
            type='text'
            placeholder='Search events...'
            value={localFilters.searchQuery || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='bg-gray-900 border-gray-700 text-white'
          />
        </div>

        {/* Date Range */}
        <div className='space-y-2'>
          <Label className='text-sm text-gray-300 flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            Date Range
          </Label>
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <Label htmlFor='start-date' className='text-xs text-gray-400'>
                From
              </Label>
              <Input
                id='start-date'
                type='date'
                value={localFilters.dateRange?.start || ""}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
                className='bg-gray-900 border-gray-700 text-white'
              />
            </div>
            <div>
              <Label htmlFor='end-date' className='text-xs text-gray-400'>
                To
              </Label>
              <Input
                id='end-date'
                type='date'
                value={localFilters.dateRange?.end || ""}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                className='bg-gray-900 border-gray-700 text-white'
              />
            </div>
          </div>
        </div>

        {/* Event Type */}
        <div className='space-y-2'>
          <Label className='text-sm text-gray-300'>Event Type</Label>
          <div className='flex gap-2'>
            <Button
              variant={
                localFilters.eventType === undefined ? "default" : "outline"
              }
              size='sm'
              onClick={() => handleEventTypeChange(undefined)}
              className={
                localFilters.eventType === undefined
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "border-gray-700 text-gray-400 hover:text-white"
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
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "border-gray-700 text-gray-400 hover:text-white"
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
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "border-gray-700 text-gray-400 hover:text-white"
              }>
              External
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
