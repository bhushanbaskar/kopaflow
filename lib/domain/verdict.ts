// Domain Types for the Evidence-Based Verdict System in Kopargaon Mobility OS

export type ClaimVerdict =
  | "VERIFIED"
  | "SUPPORTED"
  | "UNVERIFIED"
  | "CONTRADICTED"
  | "REVIEW REQUIRED";

export type EvidenceType = "SUPPORTING" | "CONTRADICTING" | "MISSING";

export type SignalSourceType =
  | "VEHICLE_TELEMATICS"
  | "CITIZEN_REPORT"
  | "OPERATOR_DISPATCH"
  | "TRAFFIC_SENSOR"
  | "ROAD_CAMERA"
  | "APMC_GATE"
  | "AUTOMATED_ANOMALY"
  | "DEPOT_LOG"
  | "PWD_MUNICIPAL"
  | "DRIVER_TELEMATICS";

export interface EvidenceItem {
  id: string;
  description: string;
  type: EvidenceType;
  sourceType: SignalSourceType;
  sourceName: string;
  timestamp: string;
  freshness: string;
  locationRelationship: string;
  details?: string;
  isConfirmed?: boolean;
}

export type OperationalActionStatus =
  | "BLOCKED"
  | "PROVISIONAL_ALLOWED"
  | "PUBLISH_ALLOWED"
  | "HELD_FOR_REVIEW";

export interface OperationalGateAction {
  actionText: string;
  status: OperationalActionStatus;
  operationalEffect: string;
  authorizedScope: string;
}

export interface EvidenceTimelineEvent {
  id: string;
  timestamp: string;
  timeLabel: string;
  sourceType: SignalSourceType;
  sourceName: string;
  title: string;
  evidenceSummary: string;
  verdict: ClaimVerdict;
  rationale: string;
  actionPermitted: string;
}

export interface ClaimRecord {
  id: string;
  claimCode: string;
  claimTitle: string;
  claimDescription: string;
  category:
    | "BUS_CANCELLATION"
    | "ROAD_BLOCKAGE"
    | "OVERCROWDING"
    | "AGRI_LOGISTICS"
    | "EV_CHARGER"
    | "ROAD_SAFETY"
    | "WORKFORCE_FATIGUE";
  entityType: "BUS" | "ROUTE" | "ROAD_SEGMENT" | "EV_CHARGER" | "APMC" | "DEPOT" | "GENERAL";
  entityId?: string;
  entityName?: string;
  reportedAt: string;
  locationName: string;
  latitude: number;
  longitude: number;
  
  // Current state of evidence
  currentEvidence: EvidenceItem[];
  
  // Current Verdict
  verdict: ClaimVerdict;
  verdictExplanation: string;
  
  // System Action Gate
  systemAction: OperationalGateAction;
  
  // Evidence Evolution Timeline
  timeline: EvidenceTimelineEvent[];
  
  // Human notes
  reviewNotes?: string[];
}
