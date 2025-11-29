'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'

export function ImageCarousel() {
  const [currentImage, setCurrentImage] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const images = ['/tum1.jpg', '/tum2.webp', '/tum3.jpg']

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index))
  }

  return (
    <>
      {/* Loading skeleton for images */}
      {!loadedImages.has(currentImage) && (
        <div className="absolute inset-0 z-0">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      {images.map((img, index) => (
        <Image
          key={img}
          src={img}
          alt={`TUM Campus ${index + 1}`}
          fill
          sizes="(max-width: 1024px) 0px, 50vw"
          className={`object-cover max-w-full transition-opacity duration-1000 ${
            index === currentImage ? 'opacity-40' : 'opacity-0'
          }`}
          priority={index === 0}
          onLoad={() => handleImageLoad(index)}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-secondary/30 to-background/60"></div>
      
      {/* Slider indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImage(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentImage 
                ? 'w-8 bg-primary' 
                : 'w-2 bg-primary/30'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </>
  )
}
