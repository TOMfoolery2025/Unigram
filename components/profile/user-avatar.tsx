"use client"

import * as React from "react"
import Image from "next/image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

/**
 * Generate a DiceBear avatar URL based on a user identifier
 * @param seed - Unique identifier (typically user ID or email)
 * @param style - DiceBear style (default: 'avataaars')
 * @returns Avatar URL
 */
export function generateAvatarUrl(seed: string, style: string = 'avataaars'): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

/**
 * Get initials from a display name
 * @param name - User's display name
 * @returns Initials (up to 2 characters)
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 sm:h-8 sm:w-8 text-xs',
  md: 'h-9 w-9 sm:h-10 sm:w-10 text-xs sm:text-sm',
  lg: 'h-14 w-14 sm:h-16 sm:w-16 text-sm sm:text-base',
  xl: 'h-20 w-20 sm:h-24 sm:w-24 text-base sm:text-lg',
}

interface UserAvatarProps {
  userId: string
  displayName?: string | null
  avatarUrl?: string | null
  size?: AvatarSize
  className?: string
}

/**
 * UserAvatar component displays a user's avatar with fallback to DiceBear or initials
 * 
 * Priority order:
 * 1. Custom avatar URL (if provided)
 * 2. DiceBear generated avatar (based on userId)
 * 3. Initials fallback (based on displayName)
 */
export function UserAvatar({
  userId,
  displayName,
  avatarUrl,
  size = 'md',
  className,
}: UserAvatarProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)
  
  const diceBearUrl = React.useMemo(
    () => generateAvatarUrl(userId),
    [userId]
  )
  
  const initials = React.useMemo(
    () => getInitials(displayName),
    [displayName]
  )
  
  // Use custom avatar if provided, otherwise use DiceBear
  const imageUrl = avatarUrl || diceBearUrl
  
  // Reset loading state when image URL changes
  React.useEffect(() => {
    setIsLoading(true)
    setHasError(false)
  }, [imageUrl])
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <div className="relative h-full w-full">
        <Image
          src={imageUrl}
          alt={displayName || 'User avatar'}
          fill
          sizes="(max-width: 640px) 32px, (max-width: 768px) 40px, (max-width: 1024px) 48px, 64px"
          className={cn(
            "object-cover max-w-full transition-opacity duration-200",
            isLoading && !hasError ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            setHasError(true)
            setIsLoading(false)
            // Hide image on error, fallback will show
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <AvatarFallback className={cn(
        isLoading && !hasError ? "opacity-50" : "opacity-100"
      )}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
