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
  | "IN_FLIGHT";

export interface Operation<T = any> {
  operation_id: string;
  entity_type: DomainEntityType;
  entity_id: string;
  operation_type: OperationType;
  payload: T;
  created_at: string;
  user_id: string;
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

export type FailureSimulationType =
  | "NETWORK_OUTAGE"
  | "PRIMARY_DATASTORE_CORRUPTION"
  | "IN_FLIGHT_FAILURE"
  | "DOMAIN_CONFLICT"
  | "PARTIAL_DATA_LOSS";

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
  device_id?: string;
  idempotency_key?: string;
}
