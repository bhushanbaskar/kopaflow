"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, XCircle, Info, ChevronRight, X } from "lucide-react";
import { getSupabaseClient } from "../../lib/supabase/client";
import { db } from "../../lib/resilience/db";
import { InformationClaimRecord } from "../../lib/resilience/types";

interface PublicCorrectionsBannerProps {
  category?: string;
  entityId?: string;
}

export function PublicCorrectionsBanner({ category, entityId }: PublicCorrectionsBannerProps) {
  const [corrections, setCorrections] = useState<InformationClaimRecord[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCorrections();
  }, [category, entityId]);

  const fetchCorrections = async () => {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from("information_claims")
        .select("*")
        .eq("is_public_correction", true)
        .order("verified_at", { ascending: false })
        .limit(3);

      if (entityId) {
        query = query.eq("entity_id", entityId);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        setCorrections(data);
      } else {
        const local = await db.claims.where("is_public_correction").equals(1 as any).toArray();
        setCorrections(local);
      }
    } catch {
      const local = await db.claims.toArray();
      setCorrections(local.filter((c) => c.is_public_correction || c.verification_status === "FALSE"));
    }
  };

  const activeCorrections = corrections.filter((c) => !dismissed[c.id]);

  if (activeCorrections.length === 0) return null;

  return (
    <div className="space-y-2 font-sans">
      {activeCorrections.map((item) => (
        <div
          key={item.id}
          className="bg-amber-50/90 border border-amber-300/80 rounded-lg p-3.5 shadow-xs flex items-start justify-between gap-3 text-xs text-amber-950 animate-in fade-in duration-150"
        >
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded bg-amber-200/60 text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[10.5px] uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                  Official Public Fact-Check
                </span>
                <span className="text-[10px] text-amber-700 font-mono">
                  Ref: {item.claim_code}
                </span>
              </div>
              <h4 className="font-bold text-gray-950 mt-1">
                {item.public_correction_text || item.official_resolution_text || item.claim_title}
              </h4>
              <p className="text-gray-700 mt-0.5 leading-relaxed text-[11.5px]">
                <strong>Context:</strong> A previous unverified rumor claiming "
                {item.claim_title.replace("Claim: ", "")}" was debunked by transport telematics.
              </p>
              {item.verified_at && (
                <span className="text-[9.5px] text-gray-500 font-mono mt-1 block">
                  Verified by Authority: {new Date(item.verified_at).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setDismissed((prev) => ({ ...prev, [item.id]: true }))}
            className="text-amber-700 hover:text-amber-950 p-1 shrink-0"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
