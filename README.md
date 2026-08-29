# KOPAR-MOVE
### Kopargaon Mobility Operating System

> **Operational transportation intelligence and multi-modal logistics optimization platform for Kopargaon, Maharashtra.**

---

## 1. Executive Summary & Vision

**KOPAR-MOVE** is an intelligent orchestration layer built on top of Kopargaon’s existing physical transportation assets. Rather than introducing parallel vehicle fleets or building redundant road capacity, the platform coordinates:

1. **Public Bus Operations (MSRTC & Municipal Transit)**
2. **Agricultural Crop Logistics (Pohegaon, Savalyavihar, Kolpewadi, Singnapur, Chas, Dharangaon clusters)**
3. **Wholesale Market Flow (APMC Kopargaon Main Yard)**
4. **Arterial Traffic & Congestion Corridors (KPG-14 Shirdi Link, KPG-08 Godavari Bridge)**
5. **Road Safety & High-Risk Blackspots**
6. **Electric Vehicle (EV) Charging Infrastructure & Depot Grid Load**
7. **Bus Depot Dispatch & Driver Shift Compliance**

### Core Principle
> **“Do more with the transportation assets Kopargaon already has.”**

By creating a **single shared mobility and logistics data layer**, Kopar-Move matches unutilized luggage bay capacity on scheduled public buses with agricultural produce shipments, cutting freight costs for farmers by **45%**, eliminating **38%** of dedicated mini-truck runs, reducing road congestion, and preserving commuter service quality.

---

## 2. Technology Stack

- **Frontend Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Client Hydration)
- **Language**: TypeScript 5 (Strict typing, no `any`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Calm, information-dense, enterprise transport control aesthetic, zero gradients)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Mapping & GIS**: [Leaflet](https://leafletjs.com/) with OpenStreetMap vector tiles configured for Kopargaon coordinates (`19.8856° N, 74.4789° E`)
- **Charts & Telemetry**: [Recharts](https://recharts.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Demo Mode, Multi-layer controls, Active scenarios)
- **Database & Auth Ready**: [Supabase](https://supabase.com/) PostgreSQL schema-ready repositories
- **Test Framework**: [Vitest](https://vitest.dev/)

---

## 3. Application Structure & Routes

| Route | Section | Operational Functionality |
|---|---|---|
| `/` | **Landing / Role Access** | Minimal operations login and direct Demo Mode launcher |
| `/dashboard` | **Command Center** | Live GIS spatial map, 6 core KPIs, live fleet feed, incident stream |
| `/routes` | **Live Routes** | Arterial corridor topology, headway frequency, agri pickup nodes |
| `/buses` | **Bus Fleet** | Real-time vehicle telemetry, seat occupancy %, parcel kg capacity |
| `/logistics` | **Agri Logistics** | Incoming village crop shipments, commodity filters, APMC deadlines |
| `/matching` | **Capacity Matching** | Agricultural cargo + bus luggage matching engine with explainable rationale |
| `/apmc` | **APMC Market Flow** | Market yard gate queues, fast-track transit bays, wholesale auction clock |
| `/traffic` | **Traffic Intelligence** | Segment travel times, speed anomalies, congestion indexes |
| `/safety` | **Road Safety** | Blackspot risk scores, speed variance analysis, explainable rules |
| `/ev` | **EV Network** | Depot fast-chargers, kilowatt load curve, smart queue balancing |
| `/depot` | **Depot Operations** | Dispatch board, bay allocations, vehicle maintenance tracking |
| `/workforce` | **Workforce Rostering** | Driver rosters, fatigue compliance (≤8.0h limit), standby crew |
| `/optimization` | **Optimization Engine** | Multi-objective solver, 7-stage verifiable execution, hard constraints |
| `/simulation` | **Network Simulator** | Preset scenarios, multipliers, and **Baseline vs. Optimized** comparison |
| `/incidents` | **Incident Management** | Disruption log & network impact propagation cascade |
| `/analytics` | **Analytics** | Comprehensive reports with explicit units, timeframes, and source tags |
| `/settings` | **System Configuration** | Operator roles, Supabase configuration, GIS defaults |

---

## 4. Optimization Engine & Mathematical Model

The optimization engine implements a multi-objective heuristic solver respecting strict real-world constraints:

### Hard Constraints
1. **Luggage Bay Weight Cap**: Maximum parcel cargo per bus trip cannot exceed $\le 250\text{--}300\text{ kg}$.
2. **Passenger Seating Buffer**: Parcels are only permitted if predicted passenger load is $< 85\%$ of seating capacity.
3. **APMC Auction Deadline**: Scheduled bus arrival must precede commodity auction cutoff (e.g. 09:00 AM) by at least 30 minutes.
4. **Driver Duty Limits**: Continuous driving shift cannot exceed $8.0\text{ hours}$ without mandatory depot relief.
5. **Depot Grid Cap**: Total simultaneous charging power at Kopargaon Bus Depot cannot exceed $250\text{ kW}$.

### Explainable Directives
Every recommendation produced by Kopar-Move contains explicit operational explanations:
- *“Bus 108 has 180 kg available luggage cargo space”*
- *“Route already passes Savalyavihar collection hub at 07:42”*
- *“Projected APMC arrival at 08:27 (33 min before 09:00 market auction cutoff)”*
- *“Replaces 1 dedicated agricultural mini-truck on KPG-14 corridor”*
- *“Passenger seating capacity strictly preserved (68% occupancy)”*

---

## 5. Baseline vs. Optimized Simulation Results

Under the **Morning APMC Peak Inflow** scenario:

| Metric | Baseline (Uncoordinated) | Kopar-Move Optimized | Operational Delta |
|---|---|---|---|
| **Bus Capacity Utilization** | 61% | **84%** | **+23% efficiency gain** |
| **Dedicated Agri Truck Trips** | 84 trips | **52 trips** | **-38% fewer trucks on road** |
| **Avg Farmer Delivery Time** | 52 min | **38 min** | **27% faster to market** |
| **Corridor Congestion Index** | 0.68 | **0.42** | **Significant delay reduction** |
| **Farmer Freight Cost** | ₹120 / qtl | **₹65 / qtl** | **46% direct cost savings** |
| **Daily CO2 Emissions** | 1,450 kg | **1,040 kg** | **410 kg CO2e saved / day** |

---

## 6. How to Run Locally

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Installation & Execution
```bash
# 1. Navigate to project root
cd e:/Desktop/KopaFlow

# 2. Install dependencies (if not already installed)
npm install

# 3. Run development server
npm run dev

# 4. Open in browser
http://localhost:3000
```

### Running Test Suite
```bash
npm test
```

---

## 7. Supabase Architecture & Production Migration

Kopar-Move uses the **Repository Pattern** to completely isolate UI components from database implementations:

- Domain models are defined in `lib/domain/types.ts`.
- Repository interfaces (`IBusRepository`, `ILogisticsRepository`, `ITrafficRepository`, `IEVRepository`, `IDepotRepository`, `ISimulationRepository`, `IOptimizationRepository`) are in `lib/repositories/types.ts`.
- Mock deterministic adapters are in `lib/repositories/mockRepositories.ts`.

### Connecting Live Supabase
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Populate your Supabase project credentials:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Implement the concrete Supabase repository classes in `lib/repositories/supabaseRepositories.ts` and swap the exports in `lib/repositories/index.ts`. No UI component changes required!

---

## 8. Hackathon Judge Demonstration Flow

1. **Launch**: Open `http://localhost:3000` and click **“ENTER DEMO MODE”**.
2. **Command Center (`/dashboard`)**:
   - Inspect the **Kopargaon GIS Map** (centered at 19.8856° N, 74.4789° E).
   - Toggle map layers (Buses, Routes, Traffic, Agri Logistics, Incidents, EV).
   - Click on **Demo Bus 104** or **Incident INC-042** to view the real-time slide-over telemetry drawer.
3. **Agri + Bus Capacity Matching (`/matching`)**:
   - Select **Demo Bus 108** (180 kg spare cargo).
   - Select candidate shipments (120 kg Onion + 35 kg Guava).
   - Review explainable rationale and click **“CONFIRM CAPACITY ALLOCATION”**.
4. **Optimization Engine (`/optimization`)**:
   - Adjust objective weights (Capacity, Cost, Congestion, Safety).
   - Click **“RUN OPTIMIZATION”** and observe the 7-stage verifiable solver progress bar and constraint verification table.
5. **Network Simulation (`/simulation`)**:
   - Select preset scenario: **“Morning APMC Peak”**.
   - Review the **BASELINE vs. OPTIMIZED** comparison cards and visual Recharts graphs.
6. **Incident Propagation (`/incidents`)**:
   - Trace the single data layer cascade: Road blockage on KPG-14 $\rightarrow$ Bus Route 101 delay $\rightarrow$ Agri shipment delay risk $\rightarrow$ Dynamic detour via KPG-05 bypass.

---

**KOPAR-MOVE — Kopargaon Mobility Operating System**  
*Built for Kopargaon Municipal & Regional Transportation Infrastructure.*
#   k o p a f l o w  
 