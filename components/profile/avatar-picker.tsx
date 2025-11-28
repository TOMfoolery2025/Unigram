"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

// DiceBear avatar styles
const AVATAR_STYLES = [
  { id: 'avataaars', name: 'Avataaars' },
  { id: 'bottts', name: 'Bottts' },
  { id: 'fun-emoji', name: 'Fun Emoji' },
  { id: 'lorelei', name: 'Lorelei' },
  { id: 'notionists', name: 'Notionists' },
  { id: 'pixel-art', name: 'Pixel Art' },
] as const

type AvatarStyle = typeof AVATAR_STYLES[number]['id']

/**
 * Generate a DiceBear avatar URL
 */
function generateAvatarUrl(seed: string, style: AvatarStyle): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

interface AvatarPickerProps {
  userId: string
  currentAvatarUrl?: string | null
  onSelect: (avatarUrl: string) => void
  className?: string
}

export function AvatarPicker({
  userId,
  currentAvatarUrl,
  onSelect,
  className,
}: AvatarPickerProps) {
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>('avataaars')
  const [selectedSeed, setSelectedSeed] = useState<string>(userId)

  // Generate preview avatars with different seeds
  const generatePreviews = (style: AvatarStyle) => {
    const seeds = [
      userId,
      `${userId}-1`,
      `${userId}-2`,
      `${userId}-3`,
      `${userId}-alt`,
      `${userId}-variant`,
    ]
    return seeds.map(seed => ({
      seed,
      url: generateAvatarUrl(seed, style),
    }))
  }

  const previews = generatePreviews(selectedStyle)
  const selectedUrl = generateAvatarUrl(selectedSeed, selectedStyle)

  // Auto-select when user clicks on an avatar
  const handleAvatarClick = (seed: string) => {
    setSelectedSeed(seed)
    const url = generateAvatarUrl(seed, selectedStyle)
    onSelect(url)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Style Selector */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-medium">Avatar Style</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AVATAR_STYLES.map((style) => (
            <Button
              key={style.id}
              type="button"
              variant={selectedStyle === style.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedStyle(style.id)
                setSelectedSeed(userId)
              }}
              className="text-xs h-8"
            >
              {style.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Avatar Previews */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-medium">Choose Avatar</Label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {previews.map((preview) => (
            <button
              key={preview.seed}
              type="button"
              onClick={() => handleAvatarClick(preview.seed)}
              className={cn(
                "relative rounded-full transition-all hover:scale-105 active:scale-95",
                selectedSeed === preview.seed
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "opacity-70 hover:opacity-100"
              )}
            >
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={preview.url} alt={`Avatar ${preview.seed}`} />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              {selectedSeed === preview.seed && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Preview */}
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border/60 bg-background/40">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shadow-lg">
          <AvatarImage src={selectedUrl} alt="Selected avatar" />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium">Preview</p>
          <p className="text-xs text-muted-foreground">
            {AVATAR_STYLES.find(s => s.id === selectedStyle)?.name}
          </p>
        </div>
      </div>
    </div>
  )
}
