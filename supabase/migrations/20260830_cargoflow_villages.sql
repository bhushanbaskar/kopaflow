-- ==============================================================================
-- KOPAR-MOVE CARGOFLOW & KOPARGAON TALUKA VILLAGE DATABASE SCHEMA
-- Migration: 20260830_cargoflow_villages.sql
-- ==============================================================================

-- Enable UUID Extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. VILLAGES MASTER TABLE (All 75 Kopargaon Taluka Villages)
CREATE TABLE IF NOT EXISTS public.villages (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    normalized_name VARCHAR(128) NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    taluka VARCHAR(64) NOT NULL DEFAULT 'Kopargaon',
    district VARCHAR(64) NOT NULL DEFAULT 'Ahilyanagar',
    state VARCHAR(64) NOT NULL DEFAULT 'Maharashtra',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    source VARCHAR(255) DEFAULT 'Census / Kopargaon Taluka Rural Directory',
    source_reference VARCHAR(255) DEFAULT 'Ref #KPG-VIL-2026',
    verification_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
    pin_code VARCHAR(16),
    has_verified_bus_stop BOOLEAN DEFAULT FALSE,
    nearest_verified_stop_id VARCHAR(64),
    nearest_verified_stop_name VARCHAR(128),
    distance_to_nearest_stop_km NUMERIC(5, 2),
    agricultural_relevance TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for normalized village lookup
CREATE INDEX IF NOT EXISTS idx_villages_normalized_name ON public.villages (normalized_name);
CREATE INDEX IF NOT EXISTS idx_villages_taluka ON public.villages (taluka);

-- 2. ROUTE-VILLAGE CORRIDOR RELATION TABLE
CREATE TABLE IF NOT EXISTS public.route_villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id VARCHAR(64) NOT NULL,
    village_id VARCHAR(64) REFERENCES public.villages(id) ON DELETE CASCADE,
    relationship_type VARCHAR(32) NOT NULL, -- 'SERVED_STOP', 'ON_ROUTE', 'NEAR_ROUTE', 'OUTSIDE_CORRIDOR'
    distance_to_route_km NUMERIC(5, 2) NOT NULL,
    bus_stop_verified BOOLEAN DEFAULT FALSE,
    bus_service_verified BOOLEAN DEFAULT FALSE,
    confidence NUMERIC(3, 2) DEFAULT 0.85,
    source VARCHAR(255) DEFAULT 'Spatial Corridor Geometry Engine',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_route_villages_route_id ON public.route_villages (route_id);
CREATE INDEX IF NOT EXISTS idx_route_villages_village_id ON public.route_villages (village_id);

-- 3. SCHEDULED TRANSPORT TRIPS & VEHICLE LUGGAGE CAPACITY
CREATE TABLE IF NOT EXISTS public.transport_trips (
    id VARCHAR(64) PRIMARY KEY,
    bus_id VARCHAR(64) NOT NULL,
    bus_number VARCHAR(64) NOT NULL,
    route_id VARCHAR(64) NOT NULL,
    route_name VARCHAR(128) NOT NULL,
    departure_time VARCHAR(32) NOT NULL,
    estimated_arrival_time VARCHAR(32) NOT NULL,
    origin_name VARCHAR(128) NOT NULL,
    destination_name VARCHAR(128) NOT NULL,
    passenger_capacity INT NOT NULL DEFAULT 45,
    passenger_count INT NOT NULL DEFAULT 0,
    max_cargo_allowance_kg NUMERIC(6, 2) NOT NULL DEFAULT 200.0,
    reserved_cargo_kg NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CARGO SHIPMENTS TABLE (Public Parcel & Produce Bookings)
CREATE TABLE IF NOT EXISTS public.cargo_shipments (
    id VARCHAR(64) PRIMARY KEY,
    reference_code VARCHAR(32) UNIQUE NOT NULL,
    user_id UUID,
    sender_name VARCHAR(128) NOT NULL,
    sender_phone VARCHAR(32) NOT NULL,
    recipient_name VARCHAR(128) NOT NULL,
    recipient_phone VARCHAR(32) NOT NULL,
    
    origin_village_id VARCHAR(64) REFERENCES public.villages(id),
    origin_village_name VARCHAR(128) NOT NULL,
    origin_stop_id VARCHAR(64),
    origin_stop_name VARCHAR(128) NOT NULL,
    is_origin_stop_verified BOOLEAN DEFAULT FALSE,
    origin_distance_to_stop_km NUMERIC(5, 2),
    
    destination_village_id VARCHAR(64),
    destination_location_name VARCHAR(128) NOT NULL,
    destination_stop_id VARCHAR(64),
    
    cargo_category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    weight_kg NUMERIC(6, 2) NOT NULL,
    length_cm NUMERIC(5, 1),
    width_cm NUMERIC(5, 1),
    height_cm NUMERIC(5, 1),
    commodity_crop VARCHAR(64),
    
    required_by VARCHAR(64) NOT NULL,
    assigned_trip_id VARCHAR(64) REFERENCES public.transport_trips(id),
    assigned_bus_number VARCHAR(64),
    assigned_route_name VARCHAR(128),
    departure_time VARCHAR(32),
    estimated_arrival_time VARCHAR(32),
    
    status VARCHAR(32) NOT NULL DEFAULT 'RESERVED',
    allocated_weight_kg NUMERIC(6, 2) NOT NULL,
    estimated_price_inr NUMERIC(8, 2) NOT NULL,
    is_price_demo_estimate BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cargo_shipments_reference ON public.cargo_shipments (reference_code);
CREATE INDEX IF NOT EXISTS idx_cargo_shipments_status ON public.cargo_shipments (status);

-- 5. MULTI-VILLAGE DEMAND AGGREGATIONS TABLE
CREATE TABLE IF NOT EXISTS public.village_demand_aggregations (
    id VARCHAR(64) PRIMARY KEY,
    corridor_name VARCHAR(128) NOT NULL,
    destination_hub VARCHAR(128) NOT NULL,
    target_arrival_deadline VARCHAR(64) NOT NULL,
    total_demand_kg NUMERIC(8, 2) NOT NULL,
    compatible_route_id VARCHAR(64) NOT NULL,
    compatible_route_name VARCHAR(128) NOT NULL,
    assigned_trip_id VARCHAR(64),
    available_capacity_kg NUMERIC(8, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'CAPACITY_SUFFICIENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS Policies
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_demand_aggregations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to villages and trips
CREATE POLICY "Public can read villages" ON public.villages FOR SELECT USING (true);
CREATE POLICY "Public can read route_villages" ON public.route_villages FOR SELECT USING (true);
CREATE POLICY "Public can read transport_trips" ON public.transport_trips FOR SELECT USING (true);
CREATE POLICY "Public can read cargo_shipments" ON public.cargo_shipments FOR SELECT USING (true);
CREATE POLICY "Public can insert cargo_shipments" ON public.cargo_shipments FOR INSERT WITH CHECK (true);
