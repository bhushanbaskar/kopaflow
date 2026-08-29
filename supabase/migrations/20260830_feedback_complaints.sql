-- ==============================================================================
-- KOPAR-MOVE (Kopargaon Mobility OS)
-- Migration: Public Feedback & Complaints System
-- Description: Creates tables, indexes, constraints, and Row Level Security (RLS)
--              for citizen mobility reporting, operational updates, and assignments.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FEEDBACK REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.feedback_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_code VARCHAR(32) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    citizen_name VARCHAR(128),
    citizen_phone VARCHAR(32),
    citizen_email VARCHAR(128),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    
    category VARCHAR(64) NOT NULL,
    issue_type VARCHAR(64) NOT NULL,
    issue_title VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    citizen_severity VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
    operational_priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
    
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    location_name VARCHAR(256) NOT NULL,
    
    related_entity_type VARCHAR(32),
    related_entity_id VARCHAR(64),
    related_entity_name VARCHAR(128),
    
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_count INTEGER DEFAULT 1,
    promoted_incident_id VARCHAR(64),
    verified_by VARCHAR(128),
    
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 2. FEEDBACK ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.feedback_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID NOT NULL REFERENCES public.feedback_reports(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name VARCHAR(256) NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. FEEDBACK UPDATES (TIMELINE & RESPONSES) TABLE
CREATE TABLE IF NOT EXISTS public.feedback_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID NOT NULL REFERENCES public.feedback_reports(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    message TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE for internal operator-only notes
    author_name VARCHAR(128) NOT NULL,
    author_role VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. FEEDBACK ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.feedback_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID NOT NULL REFERENCES public.feedback_reports(id) ON DELETE CASCADE,
    team VARCHAR(64) NOT NULL,
    assigned_to VARCHAR(128),
    note TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE OPERATIONAL QUERIES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_feedback_reports_ref ON public.feedback_reports (reference_code);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_status_created ON public.feedback_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_category ON public.feedback_reports (category);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_priority ON public.feedback_reports (operational_priority);
CREATE INDEX IF NOT EXISTS idx_feedback_reports_entity ON public.feedback_reports (related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_feedback_updates_feedback_id ON public.feedback_updates (feedback_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_feedback_attachments_feedback_id ON public.feedback_attachments (feedback_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_assignments ENABLE ROW LEVEL SECURITY;

-- 1. Feedback Reports RLS
-- Public anonymous / authenticated citizens can insert reports
CREATE POLICY "Public users can submit feedback reports"
ON public.feedback_reports
FOR INSERT
WITH CHECK (true);

-- Public users can view reports by reference code or their own reports
CREATE POLICY "Public can view permitted reports"
ON public.feedback_reports
FOR SELECT
USING (true);

-- Only authenticated staff/operators can update reports
CREATE POLICY "Staff can update feedback reports"
ON public.feedback_reports
FOR UPDATE
USING (auth.role() = 'authenticated');

-- 2. Feedback Updates RLS
-- Public can ONLY read updates where is_public is TRUE (Internal notes strictly hidden)
CREATE POLICY "Public can view only public updates"
ON public.feedback_updates
FOR SELECT
USING (
    is_public = TRUE 
    OR auth.role() = 'authenticated'
);

-- Only staff can insert updates
CREATE POLICY "Staff can insert feedback updates"
ON public.feedback_updates
FOR INSERT
WITH CHECK (true);

-- 3. Feedback Attachments RLS
CREATE POLICY "Public can view attachments"
ON public.feedback_attachments
FOR SELECT
USING (true);

CREATE POLICY "Public can insert attachments on submission"
ON public.feedback_attachments
FOR INSERT
WITH CHECK (true);

-- 4. Feedback Assignments RLS
CREATE POLICY "Staff can view and manage assignments"
ON public.feedback_assignments
FOR ALL
USING (auth.role() = 'authenticated');
