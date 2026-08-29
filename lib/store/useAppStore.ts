import { create } from "zustand";
import {
  UserRole,
  ScenarioId,
  OptimizationObjectives,
  OptimizationRun,
} from "../domain/types";

export interface MapLayerState {
  showBuses: boolean;
  showRoutes: boolean;
  showTraffic: boolean;
  showLogistics: boolean;
  showIncidents: boolean;
  showEV: boolean;
}

export type DrawerType =
  | "BUS"
  | "SHIPMENT"
  | "INCIDENT"
  | "CHARGER"
  | "ROUTE"
  | "SEGMENT"
  | "OPTIMIZATION_DETAIL"
  | null;

interface AppState {
  // Authentication & Role
  currentRole: UserRole;
  setRole: (role: UserRole) => void;

  // Demo Mode
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  setDemoMode: (enabled: boolean) => void;

  // Active Simulation Scenario
  activeScenarioId: ScenarioId;
  setActiveScenarioId: (id: ScenarioId) => void;

  // Map Layer Controls
  mapLayers: MapLayerState;
  toggleMapLayer: (layerKey: keyof MapLayerState) => void;
  setMapLayers: (layers: Partial<MapLayerState>) => void;

  // Selected Entities for Inspector / Drawers
  selectedEntityId: string | null;
  activeDrawerType: DrawerType;
  openDrawer: (type: DrawerType, entityId: string) => void;
  closeDrawer: () => void;

  // Optimization State
  optimizationObjectives: OptimizationObjectives;
  setOptimizationObjectives: (objectives: Partial<OptimizationObjectives>) => void;
  activeOptimizationRun: OptimizationRun | null;
  setActiveOptimizationRun: (run: OptimizationRun | null) => void;

  // Live Telemetry Timestamp
  liveClockTime: string;
  setLiveClockTime: (timeStr: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: "Mobility Administrator",
  setRole: (role) => set({ currentRole: role }),

  isDemoMode: true,
  toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
  setDemoMode: (enabled) => set({ isDemoMode: enabled }),

  activeScenarioId: "APMC_PEAK",
  setActiveScenarioId: (id) => set({ activeScenarioId: id }),

  mapLayers: {
    showBuses: true,
    showRoutes: true,
    showTraffic: true,
    showLogistics: true,
    showIncidents: true,
    showEV: true,
  },
  toggleMapLayer: (layerKey) =>
    set((state) => ({
      mapLayers: {
        ...state.mapLayers,
        [layerKey]: !state.mapLayers[layerKey],
      },
    })),
  setMapLayers: (layers) =>
    set((state) => ({
      mapLayers: {
        ...state.mapLayers,
        ...layers,
      },
    })),

  selectedEntityId: null,
  activeDrawerType: null,
  openDrawer: (type, entityId) =>
    set({
      activeDrawerType: type,
      selectedEntityId: entityId,
    }),
  closeDrawer: () =>
    set({
      activeDrawerType: null,
      selectedEntityId: null,
    }),

  optimizationObjectives: {
    travelTimeWeight: 75,
    operatingCostWeight: 80,
    capacityUtilizationWeight: 90,
    congestionReductionWeight: 70,
    safetyRiskReductionWeight: 65,
    primaryObjective: "MAXIMIZE_CAPACITY",
  },
  setOptimizationObjectives: (objectives) =>
    set((state) => ({
      optimizationObjectives: {
        ...state.optimizationObjectives,
        ...objectives,
      },
    })),

  activeOptimizationRun: null,
  setActiveOptimizationRun: (run) => set({ activeOptimizationRun: run }),

  liveClockTime: "16:24:12",
  setLiveClockTime: (timeStr) => set({ liveClockTime: timeStr }),
}));
