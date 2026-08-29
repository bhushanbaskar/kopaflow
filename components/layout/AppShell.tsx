"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { BottomSheet } from "../shared/BottomSheet";
import { SafeModeBanner } from "../resilience/SafeModeBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f9fafb] text-gray-900 font-sans">
      {/* Desktop Persistent Operational Sidebar (Hidden on Mobile/Tablet <1024px) */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Main Operations Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header (<1024px) */}
        <MobileHeader />

        {/* Desktop TopBar (>=1024px) */}
        <div className="hidden lg:block">
          <TopBar />
        </div>

        {/* Resilience Safe Mode & Offline Alert Banner */}
        <SafeModeBanner />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 lg:p-5 pb-24 lg:pb-5 relative bg-[#f9fafb]">
          {children}
        </main>

        {/* Mobile Bottom Navigation (<1024px) */}
        <MobileBottomNav />
      </div>

      {/* Unified Draggable BottomSheet / Side Drawer */}
      <BottomSheet />
    </div>
  );
}
