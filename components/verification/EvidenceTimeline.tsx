"use client";

import React from "react";
import { Clock, CheckCircle2, Radio, AlertTriangle, XCircle, HelpCircle, ArrowDown } from "lucide-react";
import { EvidenceTimelineEvent, ClaimVerdict } from "../../lib/domain/verdict";
import { ClaimVerdictBadge } from "./ClaimVerdictBadge";
import { cn } from "../../lib/utils/cn";

interface EvidenceTimelineProps {
  timeline: EvidenceTimelineEvent[];
  className?: string;
}

export function EvidenceTimeline({ timeline, className }: EvidenceTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-xs text-gray-500 font-mono italic p-3 text-center bg-gray-50 rounded-md border border-black/[0.05]">
        No historical evidence steps recorded.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-900 uppercase">
          <Clock className="w-3.5 h-3.5 text-gray-600" />
          <span>EVIDENCE TIMELINE & VERDICT EVOLUTION</span>
        </div>
        <span className="text-[10px] font-mono text-gray-500">
          {timeline.length} signal event{timeline.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
        {timeline.map((event, idx) => {
          const isLatest = idx === timeline.length - 1;

          return (
            <div key={event.id || idx} className="relative group">
              {/* Timeline Bullet Node */}
              <div
                className={cn(
                  "absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border",
                  isLatest
                    ? "bg-gray-950 text-white border-black ring-2 ring-emerald-500/30"
                    : "bg-white text-gray-600 border-gray-300"
                )}
              >
                {idx + 1}
              </div>

              {/* Event Content Box */}
              <div
                className={cn(
                  "rounded-md border p-2.5 text-xs transition-all space-y-1.5",
                  isLatest
                    ? "bg-white border-black/20 shadow-xs ring-1 ring-black/[0.04]"
                    : "bg-gray-50/70 border-black/[0.06] text-gray-600"
                )}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded border border-gray-200">
                      {event.timeLabel || new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="font-semibold text-gray-950 text-xs">
                      {event.title}
                    </span>
                  </div>

                  <ClaimVerdictBadge verdict={event.verdict} size="sm" />
                </div>

                <p className="text-gray-700 text-xs leading-relaxed">
                  {event.evidenceSummary}
                </p>

                <div className="pt-1 flex items-center justify-between text-[10px] font-mono border-t border-black/[0.04] text-gray-500">
                  <span>Source: {event.sourceName}</span>
                  <span className="text-gray-700 font-medium">Action: &ldquo;{event.actionPermitted}&rdquo;</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
