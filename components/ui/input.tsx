import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Mobile-first: h-12 for better touch interaction, full width
          "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background",
          // Desktop: standard h-10 height
          "md:h-10 md:text-sm",
          // File input styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder and focus states
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
