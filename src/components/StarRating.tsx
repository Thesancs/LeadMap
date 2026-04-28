'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  className?: string;
}

export default function StarRating({ rating, className }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="h-3.5 w-3.5 text-zinc-700" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="h-3.5 w-3.5 fill-cyan-400 text-cyan-400" />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-zinc-700" />
      ))}
    </div>
  );
}
