// Route-Village Corridor Calculation & Proximity Engine

import { RouteCorridorSummary, RouteVillageRelation } from "../domain/villages";
import { KOPARGAON_TALUKA_VILLAGES, getVillageByIdOrName } from "../../mock/mockVillagesData";
import { MOCK_BUS_ROUTES } from "../../mock/kopargaonData";

// Calculate Great Circle Haversine Distance in Kilometers between 2 points
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Distance from point to a line segment [p1, p2]
function distanceToSegmentKm(
  pLat: number,
  pLng: number,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const l2 = (lat2 - lat1) ** 2 + (lng2 - lng1) ** 2;
  if (l2 === 0) return calculateHaversineDistanceKm(pLat, pLng, lat1, lng1);

  // Project point onto line segment
  let t = ((pLat - lat1) * (lat2 - lat1) + (pLng - lng1) * (lng2 - lng1)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projLat = lat1 + t * (lat2 - lat1);
  const projLng = lng1 + t * (lng2 - lng1);

  return calculateHaversineDistanceKm(pLat, pLng, projLat, projLng);
}

// Distance from village point to full route polyline
export function calculateDistanceToRoutePolylineKm(
  villageLat: number,
  villageLng: number,
  polyline: [number, number][]
): number {
  if (!polyline || polyline.length === 0) return 999;
  if (polyline.length === 1) {
    return calculateHaversineDistanceKm(villageLat, villageLng, polyline[0][0], polyline[0][1]);
  }

  let minDistance = 999;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distanceToSegmentKm(
      villageLat,
      villageLng,
      polyline[i][0],
      polyline[i][1],
      polyline[i + 1][0],
      polyline[i + 1][1]
    );
    if (d < minDistance) {
      minDistance = d;
    }
  }

  return Number(minDistance.toFixed(2));
}

// Special corridor polyline definitions including intercity routes (e.g. Kopargaon -> Pune, Kopargaon -> Shirdi)
export const CORRIDOR_ROUTE_POLYLINES: Record<
  string,
  { name: string; origin: string; destination: string; polyline: [number, number][] }
> = {
  "R-01": {
    name: "Route 101 (Pohegaon Cluster)",
    origin: "Kopargaon Bus Stand",
    destination: "Pohegaon Phata Hub",
    polyline: [
      [19.8874, 74.4795],
      [19.8812, 74.472],
      [19.8712, 74.4512],
      [19.864, 74.418],
      [19.835, 74.442],
    ],
  },
  "R-02": {
    name: "Route 108 (Savalyavihar Agro)",
    origin: "Kopargaon Bus Stand",
    destination: "Savalyavihar Agro Terminal",
    polyline: [
      [19.8874, 74.4795],
      [19.8942, 74.4912],
      [19.8812, 74.5212],
      [19.878, 74.52],
      [19.852, 74.548],
    ],
  },
  "R-03": {
    name: "Route 115 (Singnapur North Hub)",
    origin: "Kopargaon Bus Stand",
    destination: "Singnapur Mandi",
    polyline: [
      [19.8874, 74.4795],
      [19.905, 74.498],
      [19.921, 74.512],
      [19.9412, 74.4612],
      [19.945, 74.421],
    ],
  },
  "R-04": {
    name: "Route 122 (Kolpewadi Sugar Mill)",
    origin: "Kopargaon Bus Stand",
    destination: "Kolpewadi Sugar Mill",
    polyline: [
      [19.8874, 74.4795],
      [19.8942, 74.4912],
      [19.8712, 74.5112],
      [19.8312, 74.5212],
      [19.812, 74.524],
    ],
  },
  "R-PUNE": {
    name: "Kopargaon ↔ Pune Intercity Corridor (via Sangamner / Chakan)",
    origin: "Kopargaon Central Stand",
    destination: "Pune Swargate Terminal",
    polyline: [
      [19.8874, 74.4795], // Kopargaon
      [19.8785, 74.5185], // Sonewadi Corridor
      [19.812, 74.524],   // Kolpewadi Corridor
      [19.7668, 74.4764], // Shirdi Phata
      [19.5712, 74.2142], // Sangamner
      [19.0142, 73.8512], // Chakan
      [18.5018, 73.8586], // Pune Swargate
    ],
  },
};

// Calculate Route Corridor Villages for a selected Route
export function calculateRouteCorridorSummary(
  routeId: string,
  corridorRadiusKm: number = 2.0
): RouteCorridorSummary {
  const corridorDef = CORRIDOR_ROUTE_POLYLINES[routeId] || {
    name: "Kopargaon Transit Route",
    origin: "Kopargaon",
    destination: "Destination",
    polyline: [
      [19.8874, 74.4795],
      [19.835, 74.442],
    ],
  };

  const existingRoute = MOCK_BUS_ROUTES.find((r) => r.id === routeId);
  const routeStops = existingRoute ? existingRoute.stops : [];

  const relations: RouteVillageRelation[] = [];

  KOPARGAON_TALUKA_VILLAGES.forEach((village) => {
    const distToRoute = calculateDistanceToRoutePolylineKm(
      village.latitude,
      village.longitude,
      corridorDef.polyline
    );

    // A village is a verified served stop ONLY if the village record itself has a verified bus stop
    // and that stop is directly on this route.
    const isStopDirectlyAtVillage =
      village.has_verified_bus_stop &&
      routeStops.some(
        (s) =>
          calculateHaversineDistanceKm(
            s.coordinates.lat,
            s.coordinates.lng,
            village.latitude,
            village.longitude
          ) <= 0.3
      );

    const isDirectServed = isStopDirectlyAtVillage || (village.has_verified_bus_stop && distToRoute <= 0.3);

    let relType: "SERVED_STOP" | "ON_ROUTE" | "NEAR_ROUTE" | "OUTSIDE_CORRIDOR";

    if (isDirectServed) {
      relType = "SERVED_STOP";
    } else if (distToRoute <= 0.5) {
      relType = "ON_ROUTE";
    } else if (distToRoute <= corridorRadiusKm) {
      relType = "NEAR_ROUTE";
    } else {
      relType = "OUTSIDE_CORRIDOR";
    }

    if (distToRoute <= corridorRadiusKm + 0.5) {
      relations.push({
        route_id: routeId,
        village_id: village.id,
        village_name: village.name,
        relationship_type: relType,
        distance_to_route_km: distToRoute,
        bus_stop_verified: isDirectServed,
        bus_service_verified: isDirectServed,
        nearest_stop_name: village.nearest_verified_stop_name,
        distance_to_nearest_stop_km: village.distance_to_nearest_stop_km,
        source: "Kopargaon Spatial Corridor Engine",
        confidence: relType === "SERVED_STOP" ? 1.0 : relType === "ON_ROUTE" ? 0.9 : 0.75,
      });
    }
  });

  // Sort relations: served stops first, then nearest to route
  relations.sort((a, b) => {
    if (a.relationship_type === "SERVED_STOP" && b.relationship_type !== "SERVED_STOP") return -1;
    if (b.relationship_type === "SERVED_STOP" && a.relationship_type !== "SERVED_STOP") return 1;
    return a.distance_to_route_km - b.distance_to_route_km;
  });

  return {
    routeId,
    routeName: corridorDef.name,
    origin: corridorDef.origin,
    destination: corridorDef.destination,
    corridorRadiusKm,
    total_relevant_villages: relations.length,
    villages_within_500m: relations.filter((r) => r.distance_to_route_km <= 0.5).length,
    villages_within_1km: relations.filter((r) => r.distance_to_route_km <= 1.0).length,
    villages_within_2km: relations.filter((r) => r.distance_to_route_km <= 2.0).length,
    verified_served_villages: relations.filter((r) => r.bus_stop_verified).length,
    villages: relations,
  };
}

// Find nearby transit routes for any given village
export function findNearbyRoutesForVillage(
  villageId: string,
  maxDistanceKm: number = 2.5
): {
  village: ReturnType<typeof getVillageByIdOrName>;
  routes: {
    routeId: string;
    routeName: string;
    distance_to_route_km: number;
    relationship_type: "SERVED_STOP" | "ON_ROUTE" | "NEAR_ROUTE";
    nearest_stop_name: string;
    distance_to_stop_km: number;
  }[];
} {
  const village = getVillageByIdOrName(villageId);
  if (!village) {
    return { village: undefined, routes: [] };
  }

  const matches: {
    routeId: string;
    routeName: string;
    distance_to_route_km: number;
    relationship_type: "SERVED_STOP" | "ON_ROUTE" | "NEAR_ROUTE";
    nearest_stop_name: string;
    distance_to_stop_km: number;
  }[] = [];

  Object.entries(CORRIDOR_ROUTE_POLYLINES).forEach(([rId, def]) => {
    const dist = calculateDistanceToRoutePolylineKm(
      village.latitude,
      village.longitude,
      def.polyline
    );

    if (dist <= maxDistanceKm) {
      matches.push({
        routeId: rId,
        routeName: def.name,
        distance_to_route_km: dist,
        relationship_type:
          village.has_verified_bus_stop && dist <= 0.4
            ? "SERVED_STOP"
            : dist <= 0.5
            ? "ON_ROUTE"
            : "NEAR_ROUTE",
        nearest_stop_name: village.nearest_verified_stop_name || "Nearest Stop",
        distance_to_stop_km: village.distance_to_nearest_stop_km || dist,
      });
    }
  });

  matches.sort((a, b) => a.distance_to_route_km - b.distance_to_route_km);

  return { village, routes: matches };
}
