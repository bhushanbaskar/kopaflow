// KOPA-MOVE Resilience Core — Comprehensive Domain-Agnostic Types

export type DomainEntityType =
  | "CARGO"
  | "COMPLAINT"
  | "DEMAND"
  | "BUS"
  | "ROAD_INCIDENT"
  | "EV_CHARGER"
  | "ROUTE"
  | "TRIP"
  | "OPTIMIZATION"
  | "DEPOT"
  | "WORKFORCE"
  | "CLAIM"
  | "CORRECTION"
  | "SYSTEM";

export type OperationType =
  // Cargo / Logistics
  | "CARGO_RESERVATION_REQUESTED"
  | "CARGO_RESERVATION_CONFIRMED"
  | "CARGO_CANCELLED"
  | "CARGO_STATUS_CHANGED"
  | "CARGO_SHIPMENT_CREATED"
  // Complaints / Feedback
  | "COMPLAINT_CREATED"
  | "COMPLAINT_STATUS_CHANGED"
  | "COMPLAINT_ASSIGNED"
  | "COMPLAINT_NOTE_ADDED"
  | "COMPLAINT_PROMOTED"
  // Information Claims & Verification
  | "CLAIM_CREATED"
  | "CLAIM_VERIFIED"
  | "CLAIM_MARKED_FALSE"
  | "CLAIM_STATUS_CHANGED"
  | "PUBLIC_CORRECTION_PUBLISHED"
  // Demand
  | "DEMAND_RECORDED"
  | "DEMAND_PLAN_UPDATED"
  // Mobility / Fleet
  | "BUS_STATUS_CHANGED"
  | "BUS_CAPACITY_UPDATED"
  | "BUS_TELEMETRY_UPDATED"
  | "ROUTE_UPDATED"
  | "TRIP_CREATED"
  | "TRIP_UPDATED"
  | "DEPOT_DISPATCH_UPDATED"
  // Traffic / Safety
  | "ROAD_INCIDENT_CREATED"
  | "ROAD_INCIDENT_STATUS_CHANGED"
  | "ROAD_SEGMENT_STATUS_CHANGED"
  // EV Infrastructure
  | "EV_CHARGER_STATUS_CHANGED"
  | "EV_BUS_QUEUED"
  // Optimization
  | "OPTIMIZATION_SCENARIO_CREATED"
  | "OPTIMIZATION_RESULT_CREATED"
  | "OPTIMIZATION_RECOMMENDATION_APPLIED";

export type OperationStatus =
  | "PENDING"
  | "SYNCING"
  | "SYNCED"
  | "CONFLICT"
  | "FAILED"
  | "REQUIRES_REVIEW"
  | "IN_FLIGHT"
  | "REJECTED_BY_AUTHORIZATION";

export interface Operation<T = any> {
  operation_id: string;
  entity_type: DomainEntityType;
  entity_id: string;
  operation_type: OperationType;
  payload: T;
  created_at: string;
  user_id: string;
  actor_user_id?: string;
  authority_id?: string;
  device_id: string;
  sequence_number: number;
  status: OperationStatus;
  idempotency_key: string;
  error_message?: string;
  retry_count?: number;
  conflict_details?: {
    reason: string;
    server_state?: any;
    client_state?: any;
    resolution_options?: string[];
  };
}

export interface RecoveryEvent<T = any> {
  event_id: string;
  operation_id: string;
  event_type: OperationType;
  aggregate_type: DomainEntityType;
  aggregate_id: string;
  payload: T;
  occurred_at: string;
  sequence_number: number;
  device_id: string;
  checksum: string;
  status: "RECORDED" | "REPLAYED" | "RECONCILED" | "SKIPPED";
}

export type SnapshotStatus = "VERIFIED" | "OUTDATED" | "CORRUPTED";

export interface RecoverySnapshot {
  snapshot_id: string;
  created_at: string;
  included_event_sequence: number;
  state_checksum: string;
  status: SnapshotStatus;
  data: {
    buses?: any[];
    routes?: any[];
    shipments?: any[];
    complaints?: any[];
    incidents?: any[];
    evChargers?: any[];
    demandObservations?: any[];
    depotDispatches?: any[];
    optimizationRuns?: any[];
    [key: string]: any;
  };
}

export type SystemIntegrityStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "OFFLINE"
  | "RECOVERING"
  | "SAFE_MODE"
  | "RESTORED";

export type RecordIntegrityState =
  | "HEALTHY"
  | "UNAVAILABLE"
  | "CORRUPTED"
  | "RECOVERED";

export type FailureSimulationType =
  | "NETWORK_OUTAGE"
  | "PRIMARY_DATASTORE_CORRUPTION"
  | "IN_FLIGHT_FAILURE"
  | "DOMAIN_CONFLICT"
  | "PARTIAL_DATA_LOSS"
  | "ROUTE_DATA_LOSS"
  | "EV_DATA_LOSS"
  | "COMPLAINT_DATA_LOSS"
  | "CARGO_DATA_LOSS"
  | "MULTI_MODULE_FAILURE"
  | "MID_OPERATION_FAILURE";

export type ScenarioType =
  | "ROUTE_DATA_LOSS"
  | "EV_DATA_LOSS"
  | "COMPLAINT_DATA_LOSS"
  | "CARGO_DATA_LOSS"
  | "MULTI_MODULE_FAILURE"
  | "MID_OPERATION_FAILURE";

export interface SystemImpactMetrics {
  routes: { total: number; healthy: number; unavailable: number; corrupted: number };
  evStations: { total: number; healthy: number; unavailable: number; corrupted: number };
  complaints: { total: number; healthy: number; unavailable: number; corrupted: number };
  cargo: { total: number; healthy: number; pendingReconciliation: number; unavailable: number };
  traffic: { total: number; healthy: number; unavailable: number; corrupted: number };
}

export interface SimulationScenarioConfig {
  id: ScenarioType;
  title: string;
  badge: string;
  description: string;
  affectedDomains: string[];
  recommended?: boolean;
}

export interface IntegrityViolation {
  rule: string;
  entity_type: DomainEntityType;
  entity_id: string;
  message: string;
  severity: "ERROR" | "WARNING";
}

export interface IntegrityCheckResult {
  status: "PASSED" | "FAILED";
  checked_at: string;
  violations: IntegrityViolation[];
  entities_checked_count: number;
  summary: {
    buses_checked: number;
    routes_checked: number;
    shipments_checked: number;
    complaints_checked: number;
    incidents_checked: number;
    ev_chargers_checked: number;
    sequence_continuity_valid: boolean;
  };
}

export interface RecoveryIncident {
  incident_id: string;
  detected_at: string;
  failure_type: FailureSimulationType;
  status: "DETECTED" | "ANALYZING" | "RECOVERING" | "RESOLVED" | "BLOCKED";
  last_verified_snapshot_id?: string;
  total_records_impacted: number;
  recoverable_count: number;
  partially_recoverable_count: number;
  unrecoverable_count: number;
  replayed_events_count: number;
  reconciled_operations_count: number;
  unrecoverable_reasons?: { entity_id: string; reason: string }[];
  details: string;
  integrity_result?: IntegrityCheckResult;
}

export interface RecoveryReportData {
  incident_id: string;
  failure_type: FailureSimulationType;
  started_at: string;
  completed_at: string;
  records_examined: number;
  recovered_count: number;
  partially_recovered_count: number;
  unrecoverable_count: number;
  operations_replayed: number;
  in_flight_reconciled: number;
  integrity_status: "PASSED" | "FAILED";
  before_counts: Record<string, number>;
  after_counts: Record<string, number>;
  unrecoverable_items: { id: string; domain: string; reason: string }[];
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  type: "SUCCESS" | "WARNING" | "ERROR" | "INFO";
  message: string;
  domain?: DomainEntityType;
  details?: string;
}

export interface CreateOperationInput<T = any> {
  entity_type: DomainEntityType;
  entity_id: string;
  operation_type: OperationType;
  payload: T;
  user_id?: string;
  actor_user_id?: string;
  authority_id?: string;
  device_id?: string;
  idempotency_key?: string;
}

export type InformationSourceType =
  | "OFFICIAL_RECORD"
  | "AUTHORITY_UPDATE"
  | "SYSTEM_DATA"
  | "SENSOR_DATA"
  | "CITIZEN_REPORT"
  | "RECOVERED_DATA"
  | "IMPORTED_DATA";

export type InformationVerificationStatus =
  | "UNVERIFIED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "FALSE"
  | "DISPUTED"
  | "OUTDATED"
  | "CORRECTED";

export type VerificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface InformationClaimRecord {
  id: string;
  claim_code: string;
  claim_type: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  submitted_by?: string;
  submitted_by_name: string;
  authority_id: string;
  claim_title: string;
  claim_description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  source_type: InformationSourceType;
  verification_status: InformationVerificationStatus;
  verification_priority: VerificationPriority;
  verified_by_user_id?: string;
  verified_by_authority_id?: string;
  verified_at?: string;
  verification_reason?: string;
  official_resolution_text?: string;
  is_public_correction: boolean;
  public_correction_text?: string;
  evidence_items: any[];
  trust_signals: {
    duplicate_count?: number;
    velocity_flag?: boolean;
    corroboration_score?: number;
    suspicious_cluster?: boolean;
    [key: string]: any;
  };
  last_verified_at?: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicCorrectionRecord {
  id: string;
  claim_id: string;
  claim_code: string;
  authority_id: string;
  authority_name: string;
  debunk_title: string;
  debunk_text: string;
  official_truth_statement: string;
  published_at: string;
  verified_by: string;
}

export interface CheckpointMetadata {
  checkpoint_id: string;
  created_at: string;
  schema_version: string;
  last_event_sequence: number;
  dataset_hash: string;
  record_counts: {
    complaints: number;
    trips: number;
    cargo_reservations: number;
    ev_chargers: number;
    road_incidents: number;
    information_claims: number;
  };
  status: "VALID" | "CORRUPTED" | "RESTORED";
}

