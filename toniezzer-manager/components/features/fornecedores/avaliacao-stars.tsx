'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvaliacaoStarsProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const labels: Record<number, string> = {
  1: 'Ruim',
  2: 'Regular',
  3: 'Bom',
  4: 'Muito Bom',
  5: 'Excelente',
}

export function AvaliacaoStars({ 
  value, 
  onChange, 
  readonly = false, 
  size = 'md',
  showLabel = false
}: AvaliacaoStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue ?? value

  const handleClick = (rating: number) => {
    if (readonly || !onChange) return
    onChange(rating)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            disabled={readonly}
            className={cn(
              'transition-colors',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors',
                star <= displayValue
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-muted-foreground/40'
              )}
            />
          </button>
        ))}
      </div>
      
      {showLabel && displayValue > 0 && (
        <span className="text-sm text-muted-foreground">
          {labels[displayValue]}
        </span>
      )}
    </div>
  )
}

