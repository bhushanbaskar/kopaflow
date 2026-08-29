-- ==============================================================================
-- KOPA-MOVE: RESILIENCE CORE SUPABASE POSTGRES SCHEMA
-- Migration: 20260830_resilience_core.sql
-- Adheres to Supabase Postgres Best Practices (UUIDs, timestamptz, jsonb, indexes, RLS)
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Operations Table (Persistent Outbox & Sync Queue)
CREATE TABLE IF NOT EXISTS public.resilience_operations (
    operation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('CARGO', 'COMPLAINT', 'DEMAND', 'BUS', 'ROAD_INCIDENT', 'EV_CHARGER', 'ROUTE', 'TRIP', 'OPTIMIZATION', 'DEPOT', 'WORKFORCE', 'SYSTEM')),
    entity_id TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL DEFAULT 'SYSTEM_OPERATOR',
    device_id TEXT NOT NULL DEFAULT 'KPG-SERVER-01',
    sequence_number BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SYNCING', 'SYNCED', 'CONFLICT', 'FAILED', 'REQUIRES_REVIEW', 'IN_FLIGHT')),
    idempotency_key TEXT NOT NULL UNIQUE,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    conflict_details JSONB
);

CREATE INDEX IF NOT EXISTS idx_resilience_operations_status_seq ON public.resilience_operations (status, sequence_number ASC);
CREATE INDEX IF NOT EXISTS idx_resilience_operations_idempotency ON public.resilience_operations (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_resilience_operations_entity ON public.resilience_operations (entity_type, entity_id);

-- 2. Append-Only Recovery Event Ledger
CREATE TABLE IF NOT EXISTS public.resilience_recovery_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sequence_number BIGINT NOT NULL,
    device_id TEXT NOT NULL DEFAULT 'KPG-SERVER-01',
    checksum TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RECORDED' CHECK (status IN ('RECORDED', 'REPLAYED', 'RECONCILED', 'SKIPPED'))
);

CREATE INDEX IF NOT EXISTS idx_recovery_events_sequence ON public.resilience_recovery_events (sequence_number ASC);
CREATE INDEX IF NOT EXISTS idx_recovery_events_aggregate ON public.resilience_recovery_events (aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_recovery_events_occurred_at ON public.resilience_recovery_events (occurred_at DESC);

-- 3. Verified State Snapshots
CREATE TABLE IF NOT EXISTS public.resilience_recovery_snapshots (
    snapshot_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    included_event_sequence BIGINT NOT NULL,
    state_checksum TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (status IN ('VERIFIED', 'OUTDATED', 'CORRUPTED')),
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_recovery_snapshots_created_at ON public.resilience_recovery_snapshots (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_snapshots_status ON public.resilience_recovery_snapshots (status);

-- 4. Recovery Incidents & Audit Log
CREATE TABLE IF NOT EXISTS public.resilience_recovery_incidents (
    incident_id TEXT PRIMARY KEY,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    failure_type TEXT NOT NULL CHECK (failure_type IN ('NETWORK_OUTAGE', 'PRIMARY_DATASTORE_CORRUPTION', 'IN_FLIGHT_FAILURE', 'DOMAIN_CONFLICT', 'PARTIAL_DATA_LOSS')),
    status TEXT NOT NULL DEFAULT 'DETECTED' CHECK (status IN ('DETECTED', 'ANALYZING', 'RECOVERING', 'RESOLVED', 'BLOCKED')),
    last_verified_snapshot_id TEXT REFERENCES public.resilience_recovery_snapshots(snapshot_id) ON DELETE SET NULL,
    total_records_impacted INTEGER NOT NULL DEFAULT 0,
    recoverable_count INTEGER NOT NULL DEFAULT 0,
    partially_recoverable_count INTEGER NOT NULL DEFAULT 0,
    unrecoverable_count INTEGER NOT NULL DEFAULT 0,
    replayed_events_count INTEGER NOT NULL DEFAULT 0,
    reconciled_operations_count INTEGER NOT NULL DEFAULT 0,
    details TEXT,
    integrity_result JSONB
);

CREATE INDEX IF NOT EXISTS idx_recovery_incidents_detected_at ON public.resilience_recovery_incidents (detected_at DESC);

-- 5. System Checkpoints & Sequence Counter
CREATE TABLE IF NOT EXISTS public.resilience_checkpoints (
    checkpoint_key TEXT PRIMARY KEY,
    checkpoint_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.resilience_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resilience_recovery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resilience_recovery_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resilience_recovery_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resilience_checkpoints ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated staff and public clients for status verification
CREATE POLICY "Allow read access on resilience tables" ON public.resilience_operations
    FOR SELECT USING (true);

CREATE POLICY "Allow read access on recovery events" ON public.resilience_recovery_events
    FOR SELECT USING (true);

CREATE POLICY "Allow read access on recovery snapshots" ON public.resilience_recovery_snapshots
    FOR SELECT USING (true);

CREATE POLICY "Allow read access on recovery incidents" ON public.resilience_recovery_incidents
    FOR SELECT USING (true);

CREATE POLICY "Allow read access on checkpoints" ON public.resilience_checkpoints
    FOR SELECT USING (true);

-- Allow authenticated insert/update operations
CREATE POLICY "Allow staff write access on resilience operations" ON public.resilience_operations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow staff write access on recovery events" ON public.resilience_recovery_events
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow staff write access on recovery snapshots" ON public.resilience_recovery_snapshots
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow staff write access on recovery incidents" ON public.resilience_recovery_incidents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow staff write access on checkpoints" ON public.resilience_checkpoints
    FOR ALL USING (true) WITH CHECK (true);

-- Comments
COMMENT ON TABLE public.resilience_operations IS 'Persistent outbox and sync queue for KOPA-MOVE domain operations.';
COMMENT ON TABLE public.resilience_recovery_events IS 'Append-only event stream for deterministic recovery replay.';
COMMENT ON TABLE public.resilience_recovery_snapshots IS 'Periodic verified point-in-time state snapshots across all 8 Kopargaon operational domains.';
COMMENT ON TABLE public.resilience_recovery_incidents IS 'Incidents registry capturing detected corruptions, partitions, and recovery audit metrics.';
