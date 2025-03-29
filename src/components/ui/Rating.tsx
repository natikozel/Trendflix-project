import { Star, StarHalf } from 'lucide-react';

interface RatingProps {
  rating: number;
  showNumber?: boolean;
  className?: string;
}

export function Rating({ rating, showNumber = false, className = '' }: RatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <StarHalf className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="w-5 h-5 text-gray-400" />
        ))}
      </div>
      
      {showNumber && (
        <span className="text-lg font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
} 