"use client";

import React, { useState } from "react";
import {
  Check,
  X,
  Minus,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Radio,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  Plus,
  Send,
} from "lucide-react";
import { ClaimRecord, SignalSourceType, EvidenceType } from "../../lib/domain/verdict";
import { ClaimVerdictBadge } from "./ClaimVerdictBadge";
import { OperationalActionGate } from "./OperationalActionGate";
import { EvidenceTimeline } from "./EvidenceTimeline";
import { formatTimeAgo } from "../../lib/utils/formatters";
import { cn } from "../../lib/utils/cn";

interface ClaimEvidenceCardProps {
  claim: ClaimRecord;
  onAddSignal?: (
    claimId: string,
    signal: {
      description: string;
      type: EvidenceType;
      sourceType: SignalSourceType;
      sourceName: string;
      locationRelationship: string;
      details?: string;
    }
  ) => void;
  onOverrideVerdict?: (claimId: string) => void;
  className?: string;
  defaultExpandedTimeline?: boolean;
}

export function ClaimEvidenceCard({
  claim,
  onAddSignal,
  onOverrideVerdict,
  className,
  defaultExpandedTimeline = false,
}: ClaimEvidenceCardProps) {
  const [showTimeline, setShowTimeline] = useState(defaultExpandedTimeline);
  const [showSignalModal, setShowSignalModal] = useState(false);

  // New Signal Simulation Form
  const [signalDesc, setSignalDesc] = useState("");
  const [signalType, setSignalType] = useState<EvidenceType>("SUPPORTING");
  const [signalSource, setSignalSource] = useState<SignalSourceType>("CITIZEN_REPORT");
  const [signalSourceName, setSignalSourceName] = useState("Citizen Report #2");

  const supportingEvidence = claim.currentEvidence.filter((e) => e.type === "SUPPORTING");
  const contradictingEvidence = claim.currentEvidence.filter((e) => e.type === "CONTRADICTING");
  const missingEvidence = claim.currentEvidence.filter((e) => e.type === "MISSING");

  const handleSimulateSignalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signalDesc.trim() || !onAddSignal) return;

    onAddSignal(claim.id, {
      description: signalDesc.trim(),
      type: signalType,
      sourceType: signalSource,
      sourceName: signalSourceName.trim() || signalSource,
      locationRelationship: `Corridor ${claim.locationName}`,
      details: "Simulated live signal ingestion via Verification Console",
    });

    setSignalDesc("");
    setShowSignalModal(false);
  };

  const getSourceIconLabel = (sourceType: SignalSourceType) => {
    switch (sourceType) {
      case "VEHICLE_TELEMATICS":
        return "GPS / Telematics";
      case "CITIZEN_REPORT":
        return "Citizen Report";
      case "OPERATOR_DISPATCH":
        return "Operator Dispatch";
      case "TRAFFIC_SENSOR":
        return "Road Sensor";
      case "PWD_MUNICIPAL":
        return "PWD / Municipal";
      case "DEPOT_LOG":
        return "Depot System";
      case "DRIVER_TELEMATICS":
        return "Driver Console";
      default:
        return sourceType.replace(/_/g, " ");
    }
  };

  return (
    <div
      className={cn(
        "bg-white border border-black/[0.08] rounded-xl shadow-xs overflow-hidden transition-all space-y-3 p-3.5 sm:p-4 hover:border-black/[0.14]",
        className
      )}
    >
      {/* 1. CLAIM HEADER */}
      <div className="space-y-1.5 border-b border-black/[0.05] pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-gray-900 text-white px-2 py-0.5 rounded tracking-wide">
              {claim.claimCode}
            </span>
            <span className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>{formatTimeAgo(claim.reportedAt)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 3. VERDICT BADGE */}
            <ClaimVerdictBadge verdict={claim.verdict} size="md" />
          </div>
        </div>

        <div className="pt-1">
          <div className="text-[10px] font-mono font-bold tracking-wider text-gray-500 uppercase">
            CLAIM
          </div>
          <h2 className="text-sm sm:text-base font-bold text-gray-950 tracking-tight leading-snug">
            &ldquo;{claim.claimTitle}&rdquo;
          </h2>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
            {claim.claimDescription}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono pt-1">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{claim.locationName}</span>
          {claim.entityName && (
            <>
              <span>•</span>
              <span className="font-semibold text-gray-700">{claim.entityName}</span>
            </>
          )}
        </div>
      </div>

      {/* 2. CURRENT EVIDENCE BREAKDOWN */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-mono font-bold text-gray-700 uppercase tracking-wider">
            CURRENT EVIDENCE ({claim.currentEvidence.length} signals)
          </span>
          <span className="text-[10px] font-mono text-gray-500">
            {supportingEvidence.length} supporting • {contradictingEvidence.length} contradicting
          </span>
        </div>

        <div className="divide-y divide-black/[0.04] rounded-lg border border-black/[0.06] bg-gray-50/50 overflow-hidden text-xs">
          {/* Supporting Items */}
          {supportingEvidence.map((item) => (
            <div key={item.id} className="p-2.5 flex items-start gap-2.5 bg-emerald-50/20">
              <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                  <span className="font-semibold text-gray-950">{item.description}</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/60 px-1.5 py-0.2 rounded font-medium">
                    {item.freshness}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10.5px] font-mono text-gray-500 mt-0.5">
                  <span className="text-gray-700 font-medium">{getSourceIconLabel(item.sourceType)}: {item.sourceName}</span>
                  <span>•</span>
                  <span>{item.locationRelationship}</span>
                </div>
                {item.details && (
                  <p className="text-[11px] text-gray-600 mt-0.5 leading-tight">{item.details}</p>
                )}
              </div>
            </div>
          ))}

          {/* Contradicting Items */}
          {contradictingEvidence.map((item) => (
            <div key={item.id} className="p-2.5 flex items-start gap-2.5 bg-rose-50/30">
              <div className="p-0.5 rounded-full bg-rose-100 text-rose-800 shrink-0 mt-0.5">
                <X className="w-3 h-3 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                  <span className="font-semibold text-rose-950">{item.description}</span>
                  <span className="text-[10px] font-mono text-rose-800 bg-rose-100/70 px-1.5 py-0.2 rounded font-medium">
                    {item.freshness}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10.5px] font-mono text-gray-500 mt-0.5">
                  <span className="text-gray-700 font-medium">{getSourceIconLabel(item.sourceType)}: {item.sourceName}</span>
                  <span>•</span>
                  <span>{item.locationRelationship}</span>
                </div>
                {item.details && (
                  <p className="text-[11px] text-rose-900/80 mt-0.5 leading-tight">{item.details}</p>
                )}
              </div>
            </div>
          ))}

          {/* Missing Evidence Items */}
          {missingEvidence.map((item) => (
            <div key={item.id} className="p-2.5 flex items-start gap-2.5 bg-white opacity-80">
              <div className="p-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0 mt-0.5">
                <Minus className="w-3 h-3 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1 flex-wrap">
                  <span className="font-medium text-gray-600">{item.description}</span>
                  <span className="text-[10px] font-mono text-gray-400">Missing / Pending</span>
                </div>
                <div className="text-[10.5px] font-mono text-gray-400 mt-0.5">
                  {getSourceIconLabel(item.sourceType)}: {item.sourceName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. VERDICT EXPLANATION BOX */}
      <div className="bg-gray-50 p-2.5 rounded-md border border-black/[0.04] text-xs text-gray-700 space-y-1">
        <div className="text-[10px] font-mono font-bold uppercase text-gray-500">
          VERDICT RATIONALE
        </div>
        <p className="font-medium text-gray-900 leading-snug">
          {claim.verdictExplanation}
        </p>
      </div>

      {/* 4. SYSTEM ACTION (Operational Action Gate) */}
      <OperationalActionGate action={claim.systemAction} verdict={claim.verdict} />

      {/* 5. COLLAPSIBLE TIMELINE & CONTROLS */}
      <div className="border-t border-black/[0.05] pt-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-700 hover:text-black transition-colors"
          >
            {showTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showTimeline ? "Hide Evidence Timeline" : "View Evidence Timeline"}</span>
            <span className="text-[10px] text-gray-400">({claim.timeline.length} events)</span>
          </button>

          <div className="flex items-center gap-1.5">
            {onAddSignal && (
              <button
                onClick={() => setShowSignalModal(!showSignalModal)}
                className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-mono font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Simulate Signal</span>
              </button>
            )}

            {onOverrideVerdict && (
              <button
                onClick={() => onOverrideVerdict(claim.id)}
                className="px-2 py-1 rounded bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-mono font-medium flex items-center gap-1 transition-colors"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Override</span>
              </button>
            )}
          </div>
        </div>

        {/* Timeline Drawer */}
        {showTimeline && (
          <div className="pt-2 border-t border-black/[0.04] animate-in fade-in duration-150">
            <EvidenceTimeline timeline={claim.timeline} />
          </div>
        )}

        {/* Signal Ingestion Modal/Drawer */}
        {showSignalModal && (
          <form
            onSubmit={handleSimulateSignalSubmit}
            className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2 text-xs animate-in fade-in duration-150"
          >
            <div className="font-mono font-bold text-blue-950 flex items-center justify-between">
              <span>SIMULATE LIVE EVIDENCE SIGNAL</span>
              <button
                type="button"
                onClick={() => setShowSignalModal(false)}
                className="text-blue-700 hover:text-blue-950"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-mono text-gray-600 block mb-0.5">Signal Nature</label>
                <select
                  value={signalType}
                  onChange={(e) => setSignalType(e.target.value as EvidenceType)}
                  className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs font-medium"
                >
                  <option value="SUPPORTING">Supporting (✓)</option>
                  <option value="CONTRADICTING">Contradicting (✗)</option>
                  <option value="MISSING">Missing Log (—)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-600 block mb-0.5">Source Type</label>
                <select
                  value={signalSource}
                  onChange={(e) => {
                    const val = e.target.value as SignalSourceType;
                    setSignalSource(val);
                    if (val === "OPERATOR_DISPATCH") setSignalSourceName("Depot Dispatch Supervisor");
                    else if (val === "VEHICLE_TELEMATICS") setSignalSourceName("AIS-140 GPS Feed");
                    else if (val === "PWD_MUNICIPAL") setSignalSourceName("PWD Incident Response");
                    else setSignalSourceName("Citizen Report");
                  }}
                  className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs font-medium"
                >
                  <option value="OPERATOR_DISPATCH">Operator Dispatch</option>
                  <option value="VEHICLE_TELEMATICS">Vehicle Telematics</option>
                  <option value="TRAFFIC_SENSOR">Traffic Speed Sensor</option>
                  <option value="CITIZEN_REPORT">Citizen Report</option>
                  <option value="PWD_MUNICIPAL">PWD / Municipal</option>
                  <option value="DEPOT_LOG">Depot System</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-600 block mb-0.5">Source Name</label>
                <input
                  type="text"
                  value={signalSourceName}
                  onChange={(e) => setSignalSourceName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-gray-600 block mb-0.5">Evidence Description</label>
              <input
                type="text"
                placeholder="e.g. Operator confirmed bus departure at platform 2..."
                value={signalDesc}
                onChange={(e) => setSignalDesc(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded p-1.5 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSignalModal(false)}
                className="px-2.5 py-1 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded flex items-center gap-1 shadow-2xs"
              >
                <Send className="w-3 h-3" />
                <span>Ingest & Recalculate Verdict</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
