/** @format */

"use client";

import React from "react";
import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventRegistrationIndicatorProps {
  isRegistered: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function EventRegistrationIndicator({
  isRegistered,
  size = "md",
  showLabel = false,
  className,
}: EventRegistrationIndicatorProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const Icon = isRegistered ? CheckCircle : Circle;
  const iconColor = isRegistered ? "text-green-500" : "text-gray-400";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Icon className={cn(sizeClasses[size], iconColor)} />
      {showLabel && (
        <span className={cn(
          "text-xs",
          isRegistered ? "text-green-600" : "text-gray-500"
        )}>
          {isRegistered ? "Registered" : "Not registered"}
        </span>
      )}
    </div>
  );
}