"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useAppStore } from "../../lib/store/useAppStore";
import {
  MOCK_BUS_FLEET,
  MOCK_BUS_ROUTES,
  MOCK_ROAD_SEGMENTS,
  MOCK_INCIDENTS,
  MOCK_EV_CHARGERS,
  MOCK_VILLAGE_CLUSTERS,
} from "../../mock/kopargaonData";
import {
  getBusRouteRoadGeometry,
  getRoadSegmentRoadGeometry,
  snapToNearestRoad,
} from "../../lib/routing/mapboxRouting";

interface KopargaonMapProps {
  height?: string;
  selectedEntityId?: string | null;
  onSelectEntity?: (type: "BUS" | "SHIPMENT" | "INCIDENT" | "CHARGER" | "SEGMENT" | "ROUTE", id: string) => void;
  className?: string;
}

export default function KopargaonMap({
  height = "520px",
  className,
}: KopargaonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [routingStatus, setRoutingStatus] = useState<string>("Loading road network...");
  const [routingWarning, setRoutingWarning] = useState<string | null>(null);

  const layerGroupsRef = useRef<{
    buses?: L.LayerGroup;
    routes?: L.LayerGroup;
    traffic?: L.LayerGroup;
    logistics?: L.LayerGroup;
    incidents?: L.LayerGroup;
    ev?: L.LayerGroup;
    infra?: L.LayerGroup;
    detours?: L.LayerGroup;
  }>({});

  const { mapLayers, openDrawer, activeOptimizationRun } = useAppStore();

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: [19.8856, 74.4789], // Kopargaon center [lat, lng]
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    // Layer Groups
    layerGroupsRef.current = {
      buses: L.layerGroup().addTo(map),
      routes: L.layerGroup().addTo(map),
      traffic: L.layerGroup().addTo(map),
      logistics: L.layerGroup().addTo(map),
      incidents: L.layerGroup().addTo(map),
      ev: L.layerGroup().addTo(map),
      infra: L.layerGroup().addTo(map),
      detours: L.layerGroup().addTo(map),
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Markers and Infrastructure Anchors
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { buses, logistics, incidents, ev, infra } = layerGroupsRef.current;

    // A. Infrastructure Anchors (APMC & Depot)
    if (infra) {
      infra.clearLayers();

      // APMC Main Market Yard [lat: 19.8942, lng: 74.4912]
      const apmcIcon = L.divIcon({
        className: "custom-apmc-marker",
        html: `<div style="background:#0f172a; color:#f8fafc; border:2px solid #38bdf8; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:10px; box-shadow:0 2px 4px rgba(0,0,0,0.3);">🏛 APMC KOPARGAON</div>`,
        iconSize: [110, 26],
      });
      L.marker([19.8942, 74.4912], { icon: apmcIcon })
        .bindPopup("<b>APMC Kopargaon Main Market Yard</b><br/>Major trading hub for Onion, Tomato & Grain")
        .addTo(infra);

      // Central Bus Depot [lat: 19.8812, lng: 74.4720]
      const depotIcon = L.divIcon({
        className: "custom-station-marker",
        html: `<div style="background:#1e293b; color:#f8fafc; border:2px solid #94a3b8; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:10px; box-shadow:0 2px 4px rgba(0,0,0,0.3);">🏢 CENTRAL BUS DEPOT</div>`,
        iconSize: [120, 26],
      });
      L.marker([19.8812, 74.472], { icon: depotIcon })
        .bindPopup("<b>Kopargaon Bus Depot & Workshop</b><br/>Fleet dispatch, maintenance bays & EV charging hub")
        .addTo(infra);
    }

    // B. Village Clusters / Agri Logistics Pickup Nodes
    if (logistics) {
      logistics.clearLayers();
      if (mapLayers.showLogistics) {
        MOCK_VILLAGE_CLUSTERS.forEach((cluster) => {
          const nodeIcon = L.divIcon({
            className: "custom-station-marker",
            html: `<div style="background:#065f46; color:#ffffff; border:1px solid #34d399; padding:2px 5px; border-radius:3px; font-size:9px; font-weight:600; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">🌾 ${cluster.name}</div>`,
            iconSize: [110, 20],
          });
          L.marker([cluster.centerCoordinates.lat, cluster.centerCoordinates.lng], { icon: nodeIcon })
            .bindPopup(`<b>${cluster.name}</b><br/>Major Crops: ${cluster.majorCommodities.join(", ")}<br/>Active Farmers: ${cluster.activeFarmersCount}<br/>Road Distance to APMC: <b>${cluster.distanceToApmcKm} km</b>`)
            .addTo(logistics);
        });
      }
    }

    // C. Bus Fleet Markers
    if (buses) {
      buses.clearLayers();
      if (mapLayers.showBuses) {
        MOCK_BUS_FLEET.forEach((bus) => {
          const isWarning = bus.status === "DELAYED";
          const bgColor = isWarning ? "#d97706" : bus.status === "ON_ROUTE" ? "#0284c7" : "#475569";

          const busIcon = L.divIcon({
            className: "custom-bus-marker",
            html: `<div style="background:${bgColor}; color:#ffffff; border:1.5px solid #ffffff; padding:2px 5px; border-radius:4px; font-weight:bold; font-size:10px; display:flex; align-items:center; gap:3px; box-shadow:0 2px 4px rgba(0,0,0,0.3);">
              <span>🚍 ${bus.busNumber.replace("Demo Bus ", "")}</span>
              <span style="font-size:9px; opacity:0.9;">(${bus.occupancyPercentage}%)</span>
            </div>`,
            iconSize: [85, 24],
          });

          const marker = L.marker([bus.coordinates.lat, bus.coordinates.lng], { icon: busIcon }).addTo(buses);

          marker.on("click", () => {
            openDrawer("BUS", bus.id);
          });
        });
      }
    }

    // D. Road Incidents
    if (incidents) {
      incidents.clearLayers();
      if (mapLayers.showIncidents) {
        MOCK_INCIDENTS.forEach((inc) => {
          const incIcon = L.divIcon({
            className: "custom-incident-marker",
            html: `<div style="background:#dc2626; color:#ffffff; border:2px solid #fee2e2; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:10px; animation:pulse 2s infinite; box-shadow:0 2px 6px rgba(220,38,38,0.5);">
              ⚠️ ${inc.code}
            </div>`,
            iconSize: [70, 24],
          });

          const marker = L.marker([inc.coordinates.lat, inc.coordinates.lng], { icon: incIcon }).addTo(incidents);
          marker.on("click", () => {
            openDrawer("INCIDENT", inc.id);
          });
        });
      }
    }

    // E. EV Charging Stations
    if (ev) {
      ev.clearLayers();
      if (mapLayers.showEV) {
        MOCK_EV_CHARGERS.forEach((charger) => {
          const chIcon = L.divIcon({
            className: "custom-station-marker",
            html: `<div style="background:#7c3aed; color:#ffffff; border:1px solid #e9d5ff; padding:2px 5px; border-radius:3px; font-size:9px; font-weight:bold;">
              ⚡ EV (${charger.availableConnectors}/${charger.totalConnectors})
            </div>`,
            iconSize: [75, 20],
          });

          const marker = L.marker([charger.coordinates.lat, charger.coordinates.lng], { icon: chIcon }).addTo(ev);
          marker.on("click", () => {
            openDrawer("CHARGER", charger.id);
          });
        });
      }
    }
  }, [mapLayers, openDrawer]);

  // 3. Asynchronously Fetch and Render Real Road Network Routes & Traffic Corridors
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let isMounted = true;
    const { routes, traffic, detours } = layerGroupsRef.current;

    async function loadRoadNetworkRoutes() {
      let totalNodes = 0;
      let failedRoutes = 0;

      // 3A. Bus Routes: Fetch turn-by-turn road network geometry for each route
      if (routes) {
        routes.clearLayers();
        if (mapLayers.showRoutes) {
          for (const route of MOCK_BUS_ROUTES) {
            try {
              const roadGeom = await getBusRouteRoadGeometry(
                route.id,
                route.stops.map((s) => s.coordinates)
              );

              if (!isMounted) return;

              // Only render if we received actual road geometry coordinates (never draw straight 2-point lines)
              if (roadGeom.latLngs && roadGeom.latLngs.length > 2) {
                totalNodes += roadGeom.latLngs.length;

                const polyline = L.polyline(roadGeom.latLngs, {
                  color: route.color,
                  weight: 4.5,
                  opacity: 0.85,
                  dashArray: route.status === "DELAYED" ? "6, 6" : undefined,
                }).addTo(routes);

                polyline.bindPopup(`
                  <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                    <div style="font-weight: bold; color: ${route.color}; font-size: 13px;">${route.routeNumber}</div>
                    <div style="font-weight: 600; color: #111827;">${route.name}</div>
                    <div style="margin-top: 4px; padding: 4px; background: #f3f4f6; border-radius: 4px; font-size: 11px;">
                      <div>🛣️ Road Distance: <strong>${roadGeom.distanceKm} km</strong></div>
                      <div>⏱️ Est. Travel Time: <strong>${roadGeom.durationMin} min</strong></div>
                      <div>📍 Road Nodes: <strong>${roadGeom.latLngs.length} points</strong></div>
                      <div>🚌 Frequency: Every ${route.frequencyMinutes}m</div>
                    </div>
                  </div>
                `);

                // Render stop markers along the road
                route.stops.forEach((stop) => {
                  const stopIcon = L.divIcon({
                    className: "custom-stop-marker",
                    html: `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${route.color}; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [8, 8],
                    iconAnchor: [4, 4],
                  });

                  L.marker([stop.coordinates.lat, stop.coordinates.lng], { icon: stopIcon })
                    .bindPopup(`<b>${stop.name}</b><br/>${route.routeNumber} • Scheduled Offset: +${stop.scheduledArrivalOffsetMin}m`)
                    .addTo(routes);
                });
              } else {
                failedRoutes++;
                console.warn(`Route ${route.routeNumber} returned insufficient coordinates. Straight line suppressed.`);
              }
            } catch (err) {
              failedRoutes++;
              console.error(`Error resolving road route for ${route.routeNumber}:`, err);
            }
          }
        }
      }

      // 3B. Traffic Corridors: Fetch road-network geometry for monitored segments
      if (traffic) {
        traffic.clearLayers();
        if (mapLayers.showTraffic) {
          for (const seg of MOCK_ROAD_SEGMENTS) {
            try {
              const segRoadGeom = await getRoadSegmentRoadGeometry(seg.id, seg.startPoint, seg.endPoint);
              if (!isMounted) return;

              if (segRoadGeom.latLngs && segRoadGeom.latLngs.length > 2) {
                totalNodes += segRoadGeom.latLngs.length;

                const color =
                  seg.congestionLevel === "SEVERE" || seg.status === "BLOCKED"
                    ? "#dc2626"
                    : seg.congestionLevel === "HIGH"
                    ? "#ea580c"
                    : seg.congestionLevel === "MODERATE"
                    ? "#d97706"
                    : "#16a34a";

                const polyline = L.polyline(segRoadGeom.latLngs, {
                  color,
                  weight: 6,
                  opacity: 0.65,
                }).addTo(traffic);

                polyline.bindPopup(`
                  <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                    <div style="font-weight: bold; color: #111827;">${seg.code}: ${seg.name}</div>
                    <div style="margin-top: 4px; padding: 4px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 11px;">
                      <div>🛣️ Corridor Length: <strong>${segRoadGeom.distanceKm} km</strong></div>
                      <div>⚡ Current Speed: <strong>${seg.currentSpeedKmh} km/h</strong> (Base: ${seg.baselineSpeedKmh})</div>
                      <div>🚦 Congestion Index: <strong>${(seg.congestionIndex * 100).toFixed(0)}% (${seg.congestionLevel})</strong></div>
                      <div>⏱️ Transit Time: <strong>${seg.currentTravelTimeMin}m</strong> (Base: ${seg.baselineTravelTimeMin}m)</div>
                    </div>
                  </div>
                `);
              }
            } catch (err) {
              console.error(`Error resolving traffic segment ${seg.code}:`, err);
            }
          }
        }
      }

      // 3C. Active Optimization Detours
      if (detours && activeOptimizationRun) {
        detours.clearLayers();
        for (const rec of activeOptimizationRun.recommendations) {
          if (rec.routeLatLngs && rec.routeLatLngs.length > 2) {
            const isDetour = rec.type === "ROUTE_DETOUR";
            const lineColor = isDetour ? "#10b981" : "#0284c7";

            L.polyline(rec.routeLatLngs, {
              color: lineColor,
              weight: 5,
              opacity: 0.9,
              dashArray: "8, 6",
            })
              .bindPopup(`
                <div style="font-family: monospace; font-size: 11px;">
                  <div style="font-weight: bold; color: ${lineColor};">${rec.title}</div>
                  <div>Road Distance: <strong>${rec.roadDistanceKm} km</strong> • Est. Time: <strong>${rec.estimatedTravelTimeMin}m</strong></div>
                </div>
              `)
              .addTo(detours);
          }
        }
      }

      if (isMounted) {
        if (failedRoutes > 0) {
          setRoutingWarning(`${failedRoutes} route(s) suppressed due to network unavailability (markers intact)`);
        } else {
          setRoutingWarning(null);
        }
        setRoutingStatus(`Road Network Active (${totalNodes} nodes)`);
      }
    }

    loadRoadNetworkRoutes();

    return () => {
      isMounted = false;
    };
  }, [mapLayers, activeOptimizationRun]);

  return (
    <div
      className={className}
      style={{ height, width: "100%", position: "relative", zIndex: 0 }}
      ref={mapContainerRef}
    >
      {/* Floating Non-Intrusive Real Road Routing Status Badge */}
      <div className="absolute top-3 right-3 z-[1000] pointer-events-none flex flex-col items-end gap-1 font-mono text-[10px]">
        <div className="bg-slate-950/85 backdrop-blur text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded shadow-md flex items-center gap-1.5 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{routingStatus}</span>
        </div>
        {routingWarning && (
          <div className="bg-amber-950/85 backdrop-blur text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded shadow-md font-semibold">
            ⚠️ {routingWarning}
          </div>
        )}
      </div>
    </div>
  );
}
