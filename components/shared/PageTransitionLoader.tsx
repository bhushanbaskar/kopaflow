"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PageTransitionLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [displayKey, setDisplayKey] = useState(pathname);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
      setDisplayKey(pathname);
    }, 160);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* iOS-Style Top Gradient Progress Bar during page transitions */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-gradient-to-r from-blue-500 via-emerald-400 to-indigo-500 transition-all duration-300 pointer-events-none ${
          isNavigating ? "opacity-100 translate-y-0 scale-x-100" : "opacity-0 -translate-y-1 scale-x-0"
        }`}
        style={{ transformOrigin: "0% 50%" }}
      />

      {/* Fluid Page Body Animation */}
      <div
        key={displayKey}
        className="w-full flex-1 flex flex-col animate-ios-slide-up duration-300 ease-out"
      >
        {children}
      </div>
    </div>
  );
}
