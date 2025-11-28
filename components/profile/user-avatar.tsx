"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-24 w-24 text-lg',
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
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={imageUrl} alt={displayName || 'User avatar'} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
