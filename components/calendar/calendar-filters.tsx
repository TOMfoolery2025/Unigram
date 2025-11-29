/** @format */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CalendarFiltersProps {
  showOnlyRegistered: boolean;
  onFilterChange: (showOnlyRegistered: boolean) => void;
}

export function CalendarFilters({
  showOnlyRegistered,
  onFilterChange,
}: CalendarFiltersProps) {
  return (
    <Card className="p-2">
      <div className="flex gap-1">
        <Button
          variant={!showOnlyRegistered ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(false)}
          className={`text-xs ${!showOnlyRegistered ? 'bg-red-500 hover:bg-red-600 text-white' : 'border-red-500/50 text-red-400 hover:bg-red-500/10'}`}
        >
          All Events
        </Button>
        <Button
          variant={showOnlyRegistered ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(true)}
          className={`text-xs ${showOnlyRegistered ? 'bg-red-500 hover:bg-red-600 text-white' : 'border-red-500/50 text-red-400 hover:bg-red-500/10'}`}
        >
          My Events
        </Button>
      </div>
    </Card>
  );
}