"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvaliacaoStarsProps {
  value: number | null;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function AvaliacaoStars({
  value,
  onChange,
  readonly = false,
  size = "md",
}: AvaliacaoStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value ?? 0;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(null)}
          className={cn(
            "transition-colors",
            !readonly && "cursor-pointer hover:scale-110 transition-transform",
            readonly && "cursor-default"
          )}
        >
          <Star
            className={cn(
              sizes[size],
              star <= displayValue
                ? "text-amber-500 fill-amber-500"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}

