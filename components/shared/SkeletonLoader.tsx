import React from "react";
import { cn } from "../../lib/utils/cn";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  count?: number;
}

export function SkeletonLoader({
  className,
  variant = "rectangular",
  count = 1,
}: SkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "skeleton-shimmer rounded-lg",
            variant === "text" && "h-3.5 w-full rounded",
            variant === "circular" && "w-10 h-10 rounded-full",
            variant === "card" && "h-28 w-full rounded-2xl border border-black/[0.04]",
            className
          )}
        />
      ))}
    </>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-ios-fade-in">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-ios-card space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SkeletonLoader variant="circular" className="w-8 h-8" />
              <div className="space-y-1.5">
                <SkeletonLoader variant="text" className="w-28 h-3.5" />
                <SkeletonLoader variant="text" className="w-40 h-2.5" />
              </div>
            </div>
            <SkeletonLoader variant="rectangular" className="w-16 h-5 rounded-full" />
          </div>
          <SkeletonLoader variant="rectangular" className="w-full h-12 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
