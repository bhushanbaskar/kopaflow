// Mapbox Routing and Matrix API Types for Kopar-Move

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

export type RoutingProfile = "driving-traffic" | "driving" | "walking" | "cycling";

export interface RouteOptions {
  origin: GeoPoint;
  destination: GeoPoint;
  waypoints?: GeoPoint[];
  profile?: RoutingProfile;
  overview?: "full" | "simplified";
  geometries?: "geojson" | "polyline" | "polyline6";
  snapping?: boolean;
}

export interface GeoJSONLineString {
  type: "LineString";
  coordinates: [number, number][]; // [longitude, latitude] as per GeoJSON specification
}

export interface RouteStep {
  name: string;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  location: [number, number]; // [lng, lat]
}

export interface RouteGeometryResult {
  geometry: GeoJSONLineString;
  /** Leaflet-compatible [lat, lng] array coordinates */
  latLngs: [number, number][];
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMin: number;
  summary: string;
  snappedOrigin: GeoPoint;
  snappedDestination: GeoPoint;
  snappedWaypoints: GeoPoint[];
  profile: RoutingProfile;
  congestionIndex?: number;
}

export interface MatrixOptions {
  origins: GeoPoint[];
  destinations: GeoPoint[];
  profile?: RoutingProfile;
}

export interface MatrixResult {
  /** Durations in seconds from origin i to destination j: durations[i][j] */
  durations: number[][];
  /** Distances in meters from origin i to destination j: distances[i][j] */
  distances: number[][];
  /** Durations in minutes: durationsMin[i][j] */
  durationsMin: number[][];
  /** Distances in km: distancesKm[i][j] */
  distancesKm: number[][];
  origins: GeoPoint[];
  destinations: GeoPoint[];
}

export interface SnappedPoint {
  original: GeoPoint;
  snapped: GeoPoint;
  distanceToRoadMeters: number;
  roadName?: string;
}
