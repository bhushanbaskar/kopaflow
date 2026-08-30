-- ============================================================================
-- KOPA-MOVE Information Claims, Provenance & Verification Defense Migration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.information_claims (
  id TEXT PRIMARY KEY DEFAULT ('claim-' || substr(md5(random()::text), 1, 8)),
  claim_code TEXT NOT NULL UNIQUE,
  claim_type TEXT NOT NULL, -- BUS_ROUTE_STATUS, EV_STATION_STATUS, ROAD_HAZARD, CIVIC_INFRASTRUCTURE, SCHEME_GOVERNANCE, OTHER
  entity_type TEXT NOT NULL, -- BUS, ROUTE, EV_STATION, ROAD_INCIDENT, COMPLAINT, ANNOUNCEMENT, GENERAL
  entity_id TEXT,
  entity_name TEXT,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_by_name TEXT NOT NULL DEFAULT 'Public Citizen',
  authority_id TEXT NOT NULL REFERENCES public.authorities(id) ON DELETE RESTRICT,
  claim_title TEXT NOT NULL,
  claim_description TEXT NOT NULL,
  location_name TEXT NOT NULL DEFAULT 'Kopargaon',
  latitude DOUBLE PRECISION NOT NULL DEFAULT 19.8874,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 74.4795,
  source_type TEXT NOT NULL DEFAULT 'CITIZEN_REPORT', -- OFFICIAL_RECORD, AUTHORITY_UPDATE, SYSTEM_DATA, SENSOR_DATA, CITIZEN_REPORT, RECOVERED_DATA, IMPORTED_DATA
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED', -- UNVERIFIED, UNDER_REVIEW, VERIFIED, FALSE, DISPUTED, OUTDATED, CORRECTED
  verification_priority TEXT NOT NULL DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
  verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_by_authority_id TEXT REFERENCES public.authorities(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verification_reason TEXT,
  official_resolution_text TEXT,
  is_public_correction BOOLEAN NOT NULL DEFAULT FALSE,
  public_correction_text TEXT,
  evidence_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  trust_signals JSONB NOT NULL DEFAULT '{"duplicate_count": 0, "velocity_flag": false, "corroboration_score": 1}'::jsonb,
  last_verified_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Covering Indexes
CREATE INDEX IF NOT EXISTS idx_claims_authority_status ON public.information_claims (authority_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_claims_entity ON public.information_claims (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_claims_source_type ON public.information_claims (source_type);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON public.information_claims (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_claims_submitted_by ON public.information_claims (submitted_by);
CREATE INDEX IF NOT EXISTS idx_claims_verified_by ON public.information_claims (verified_by_user_id);

-- Enable RLS
ALTER TABLE public.information_claims ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (public & authenticated) can view published claims and public corrections
CREATE POLICY "Public read access for information claims"
  ON public.information_claims
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Authenticated users (Citizens & Officials) can submit new unverified claims / reports
CREATE POLICY "Authenticated users can submit claims"
  ON public.information_claims
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Citizens can only submit as UNVERIFIED with CITIZEN_REPORT
    (verification_status = 'UNVERIFIED' AND source_type = 'CITIZEN_REPORT')
    OR
    -- Officials can submit official updates matching their authority
    (EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.authority_id = authority_id OR p.role_id = 'ROLE_SUPER_ADMIN')
    ))
  );

-- 3. Only authorities with matching domain scope or super admins can update/verify claims
CREATE POLICY "Authorities can update claims in their domain"
  ON public.information_claims
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.authority_id = public.information_claims.authority_id OR p.role_id = 'ROLE_SUPER_ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.authority_id = public.information_claims.authority_id OR p.role_id = 'ROLE_SUPER_ADMIN')
    )
  );

-- Grant Table Permissions
GRANT ALL ON TABLE public.information_claims TO anon, authenticated, service_role;

-- Seed Initial Mock Claims for Live Verification Demo
INSERT INTO public.information_claims (
  id, claim_code, claim_type, entity_type, entity_id, entity_name,
  submitted_by_name, authority_id, claim_title, claim_description,
  location_name, source_type, verification_status, verification_priority,
  evidence_items, trust_signals, created_at
) VALUES
(
  'claim-demo-001',
  'CLM-KP003',
  'BUS_ROUTE_STATUS',
  'BUS',
  'BUS-104',
  'Bus BUS-104 (Kopargaon → Pune Express)',
  'Citizen Post (WhatsApp Forward)',
  'AUTH-TRANSPORT',
  'Claim: 08:30 Kopargaon → Pune bus service cancelled',
  'Unverified social media report claiming the 08:30 scheduled departure on Route 01 has been completely cancelled by the depot due to driver shortage.',
  'Kopargaon Central Bus Stand, Bay 2',
  'CITIZEN_REPORT',
  'UNVERIFIED',
  'HIGH',
  '[
    {"id": "ev-01", "type": "CONTRADICTING", "sourceType": "VEHICLE_TELEMATICS", "sourceName": "AIS-140 GPS Unit", "description": "Vehicle actively transmitting GPS telemetry at 28 km/h on Route 01.", "timestamp": "2026-08-30T08:34:00Z"},
    {"id": "ev-02", "type": "CONTRADICTING", "sourceType": "DEPOT_LOG", "sourceName": "Central Depot Roster", "description": "Dispatch schedule status is BOARDING with driver clocked in.", "timestamp": "2026-08-30T08:32:00Z"}
  ]'::jsonb,
  '{"duplicate_count": 4, "velocity_flag": true, "corroboration_score": 1}'::jsonb,
  NOW() - INTERVAL '15 minutes'
),
(
  'claim-demo-002',
  'CLM-EV002',
  'EV_STATION_STATUS',
  'EV_STATION',
  'ev-apmc-kpg',
  'APMC Market Yard EV Station #1',
  'EV Rider Community',
  'AUTH-EV-MAHAVITARAN',
  'Claim: APMC 60kW DC Fast Charger is permanently closed',
  'Claim claiming the high-speed DC charger is decommissioned and unavailable for rural agricultural freight e-rickshaws.',
  'APMC Market Yard, Station Road',
  'CITIZEN_REPORT',
  'UNVERIFIED',
  'NORMAL',
  '[
    {"id": "ev-03", "type": "CONTRADICTING", "sourceType": "SYSTEM_DATA", "sourceName": "OCPP 2.0.1 Live Telemetry", "description": "Charger is operational; minor grid voltage fluctuation cleared 20 mins ago.", "timestamp": "2026-08-30T08:40:00Z"}
  ]'::jsonb,
  '{"duplicate_count": 2, "velocity_flag": false, "corroboration_score": 1}'::jsonb,
  NOW() - INTERVAL '30 minutes'
),
(
  'claim-demo-003',
  'CLM-PWD004',
  'CIVIC_INFRASTRUCTURE',
  'ROAD_INCIDENT',
  'INC-901',
  'Pohegaon Bypass Drainage Trench',
  'Local Shopkeeper Association',
  'AUTH-CIVIC',
  'Claim: Pohegaon main road completely impassable for heavy buses',
  'Citizen claims monsoon waterlogging has breached the culvert, requiring complete diversion of all state transport buses.',
  'Pohegaon Bypass Phata',
  'CITIZEN_REPORT',
  'UNDER_REVIEW',
  'URGENT',
  '[
    {"id": "ev-04", "type": "SUPPORTING", "sourceType": "CITIZEN_REPORT", "sourceName": "Citizen Photo #819", "description": "Water accumulation of 1.2 feet near low-lying culvert.", "timestamp": "2026-08-30T08:15:00Z"}
  ]'::jsonb,
  '{"duplicate_count": 6, "velocity_flag": true, "corroboration_score": 2}'::jsonb,
  NOW() - INTERVAL '45 minutes'
)
ON CONFLICT (claim_code) DO NOTHING;
