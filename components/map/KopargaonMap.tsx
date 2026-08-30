"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Maximize2, Minimize2, Compass, Layers, X } from "lucide-react";
import { useAppStore } from "../../lib/store/useAppStore";
import {
  MOCK_BUS_FLEET,
  MOCK_BUS_ROUTES,
  MOCK_ROAD_SEGMENTS,
  MOCK_INCIDENTS,
  MOCK_EV_CHARGERS,
  MOCK_VILLAGE_CLUSTERS,
  MOCK_ACCIDENT_ZONES,
} from "../../mock/kopargaonData";
import {
  getBusRouteRoadGeometry,
  getRoadSegmentRoadGeometry,
} from "../../lib/routing/mapboxRouting";
import { MapLayerControls } from "./MapLayerControls";
import { cn } from "../../lib/utils/cn";

interface KopargaonMapProps {
  height?: string;
  selectedEntityId?: string | null;
  onSelectEntity?: (type: "BUS" | "SHIPMENT" | "INCIDENT" | "CHARGER" | "SEGMENT" | "ROUTE" | "ACCIDENT_ZONE", id: string) => void;
  className?: string;
  allowFullscreen?: boolean;
}

export default function KopargaonMap({
  height = "520px",
  className,
  allowFullscreen = true,
}: KopargaonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [routingStatus, setRoutingStatus] = useState<string>("Loading road network...");
  const [routingWarning, setRoutingWarning] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const layerGroupsRef = useRef<{
    buses?: L.LayerGroup;
    routes?: L.LayerGroup;
    traffic?: L.LayerGroup;
    logistics?: L.LayerGroup;
    incidents?: L.LayerGroup;
    ev?: L.LayerGroup;
    infra?: L.LayerGroup;
    detours?: L.LayerGroup;
    blackspots?: L.LayerGroup;
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

    // 100% Free & Open OpenStreetMap Tiles (No API key required, permanently free)
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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
      blackspots: L.layerGroup().addTo(map),
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Fullscreen transitions & Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Invalidate size on fullscreen toggle & window resize
  useEffect(() => {
    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };

    window.addEventListener("resize", handleResize);

    if (mapInstanceRef.current) {
      // Staggered invalidateSize for smooth animation/render transitions
      const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
      const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
      const t3 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);

      return () => {
        window.removeEventListener("resize", handleResize);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [isFullscreen, height]);

  // Center on Kopargaon action
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([19.8856, 74.4789], 13, {
        animate: true,
      });
    }
  };

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
        className: "uber-pin-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #0f172a; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2.5px solid #ffffff;">
              🏛
            </div>
            <div style="margin-top: 3px; background: #0f172a; color: #ffffff; border: 1px solid rgba(255,255,255,0.2); padding: 1.5px 6px; border-radius: 9999px; font-weight: 700; font-size: 8.5px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2); font-family: monospace;">
              APMC YARD
            </div>
          </div>
        `,
        iconSize: [80, 48],
        iconAnchor: [40, 14],
      });
      L.marker([19.8942, 74.4912], { icon: apmcIcon })
        .bindPopup("<b>APMC Kopargaon Main Market Yard</b><br/>Major trading hub for Onion, Tomato & Grain")
        .addTo(infra);

      // Central Bus Depot [lat: 19.8812, lng: 74.4720]
      const depotIcon = L.divIcon({
        className: "uber-pin-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #1e293b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2.5px solid #ffffff;">
              🏢
            </div>
            <div style="margin-top: 3px; background: #1e293b; color: #ffffff; border: 1px solid rgba(255,255,255,0.2); padding: 1.5px 6px; border-radius: 9999px; font-weight: 700; font-size: 8.5px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2); font-family: monospace;">
              BUS DEPOT
            </div>
          </div>
        `,
        iconSize: [80, 48],
        iconAnchor: [40, 14],
      });
      L.marker([19.8812, 74.472], { icon: depotIcon })
        .bindPopup("<b>Kopargaon Bus Depot & Workshop</b><br/>Fleet dispatch & maintenance bays")
        .addTo(infra);
    }

    // B. Village Clusters / Agri Logistics Pickup Nodes (Glowing Destination Pins)
    if (logistics) {
      logistics.clearLayers();
      if (mapLayers.showLogistics) {
        MOCK_VILLAGE_CLUSTERS.forEach((cluster) => {
          const nodeIcon = L.divIcon({
            className: "uber-pin-marker",
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: #059669; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 11px; box-shadow: 0 4px 10px rgba(5,150,105,0.35); border: 2px solid #ffffff;">
                  🌾
                </div>
                <div style="margin-top: 2px; background: #064e3b; color: #a7f3d0; border: 1px solid rgba(167,243,208,0.3); padding: 1px 5px; border-radius: 9999px; font-size: 8px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
                  ${cluster.name}
                </div>
              </div>
            `,
            iconSize: [70, 42],
            iconAnchor: [35, 12],
          });
          L.marker([cluster.centerCoordinates.lat, cluster.centerCoordinates.lng], { icon: nodeIcon })
            .bindPopup(`<b>${cluster.name}</b><br/>Major Crops: ${cluster.majorCommodities.join(", ")}<br/>Active Farmers: ${cluster.activeFarmersCount}<br/>Road Distance to APMC: <b>${cluster.distanceToApmcKm} km</b>`)
            .addTo(logistics);
        });
      }
    }

    // C. Bus Fleet Markers - Uber / Google Maps Navigation Puck Style
    if (buses) {
      buses.clearLayers();
      if (mapLayers.showBuses) {
        MOCK_BUS_FLEET.forEach((bus) => {
          const isWarning = bus.status === "DELAYED";
          const puckColor = isWarning ? "#ea580c" : bus.status === "ON_ROUTE" ? "#2563eb" : "#475569";
          const haloColor = isWarning ? "rgba(234, 88, 12, 0.25)" : "rgba(37, 99, 235, 0.25)";

          const busIcon = L.divIcon({
            className: "uber-puck-marker",
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                  <div style="position: absolute; inset: 0; border-radius: 50%; background: ${haloColor}; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                  <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: ${puckColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2.5px solid #ffffff;">
                    🚍
                  </div>
                </div>
                <div style="margin-top: 1px; background: #0f172a; color: #ffffff; border: 1px solid rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 9999px; font-weight: 700; font-size: 8px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.25); font-family: monospace;">
                  ${bus.plateNumber.split("-")[2] || bus.plateNumber} • ${bus.occupancyPercentage}%
                </div>
              </div>
            `,
            iconSize: [80, 48],
            iconAnchor: [40, 15],
          });

          const marker = L.marker([bus.coordinates.lat, bus.coordinates.lng], { icon: busIcon }).addTo(buses);

          marker.on("click", () => {
            openDrawer("BUS", bus.id);
          });
        });
      }
    }

    // D. Road Incidents - Coral Warning Pulsing Pin
    if (incidents) {
      incidents.clearLayers();
      if (mapLayers.showIncidents) {
        MOCK_INCIDENTS.forEach((inc) => {
          const incIcon = L.divIcon({
            className: "uber-pin-marker",
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
                  <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(220, 38, 38, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                  <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background: #dc2626; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 4px 10px rgba(220,38,38,0.4); border: 2px solid #ffffff;">
                    ⚠️
                  </div>
                </div>
                <div style="margin-top: 1px; background: #7f1d1d; color: #fecaca; border: 1px solid rgba(254,202,202,0.3); padding: 1px 5px; border-radius: 9999px; font-weight: 700; font-size: 8px; white-space: nowrap; font-family: monospace;">
                  ${inc.code}
                </div>
              </div>
            `,
            iconSize: [60, 42],
            iconAnchor: [30, 13],
          });

          const marker = L.marker([inc.coordinates.lat, inc.coordinates.lng], { icon: incIcon }).addTo(incidents);
          marker.on("click", () => {
            openDrawer("INCIDENT", inc.id);
          });
        });
      }
    }

    // E. EV Charging Stations - Purple Lightning Pin
    if (ev) {
      ev.clearLayers();
      if (mapLayers.showEV) {
        MOCK_EV_CHARGERS.forEach((charger) => {
          const chIcon = L.divIcon({
            className: "uber-pin-marker",
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background: #7c3aed; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 3px 8px rgba(124,58,237,0.35); border: 2px solid #ffffff;">
                  ⚡
                </div>
                <div style="margin-top: 1px; background: #4c1d95; color: #ddd6fe; border: 1px solid rgba(221,214,254,0.3); padding: 1px 5px; border-radius: 9999px; font-size: 7.5px; font-weight: 600; white-space: nowrap;">
                  ${charger.availableConnectors}/${charger.totalConnectors}
                </div>
              </div>
            `,
            iconSize: [60, 38],
            iconAnchor: [30, 11],
          });

          const marker = L.marker([charger.coordinates.lat, charger.coordinates.lng], { icon: chIcon }).addTo(ev);
          marker.on("click", () => {
            openDrawer("CHARGER", charger.id);
          });
        });
      }
    }

    // F. Accident-Prone Zones (Blackspots) - Pulsing Danger Beacon & Risk Radius Circle
    const { blackspots } = layerGroupsRef.current;
    if (blackspots) {
      blackspots.clearLayers();
      if (mapLayers.showBlackspots) {
        MOCK_ACCIDENT_ZONES.forEach((zone) => {
          const isCritical = zone.severityLevel === "CRITICAL_BLACKSPOT";
          const isHigh = zone.severityLevel === "HIGH_RISK";

          const primaryColor = isCritical ? "#be123c" : isHigh ? "#c2410c" : "#d97706";
          const haloColor = isCritical ? "rgba(225, 29, 72, 0.35)" : isHigh ? "rgba(234, 88, 12, 0.35)" : "rgba(217, 119, 6, 0.35)";
          const badgeBg = isCritical ? "#881337" : isHigh ? "#7c2d12" : "#78350f";

          // 1. Render Safety Risk Radius Circle
          L.circle([zone.coordinates.lat, zone.coordinates.lng], {
            radius: zone.riskRadiusMeters,
            color: primaryColor,
            fillColor: primaryColor,
            fillOpacity: 0.16,
            weight: 2,
            dashArray: "5, 5",
          }).addTo(blackspots);

          // 2. Render Interactive Hazard Marker
          const blackspotIcon = L.divIcon({
            className: "uber-pin-marker",
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                  <div style="position: absolute; inset: 0; border-radius: 50%; background: ${haloColor}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                  <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background: ${primaryColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 4px 12px ${haloColor}; border: 2.5px solid #ffffff;">
                    ⚠️
                  </div>
                </div>
                <div style="margin-top: 1.5px; background: ${badgeBg}; color: #ffffff; border: 1px solid rgba(255,255,255,0.4); padding: 1px 6px; border-radius: 9999px; font-weight: 800; font-size: 8px; white-space: nowrap; font-family: monospace; box-shadow: 0 2px 5px rgba(0,0,0,0.35);">
                  ${zone.id} • ${isCritical ? "CRITICAL" : "ACCIDENT ZONE"}
                </div>
              </div>
            `,
            iconSize: [80, 44],
            iconAnchor: [40, 15],
          });

          const marker = L.marker([zone.coordinates.lat, zone.coordinates.lng], { icon: blackspotIcon }).addTo(blackspots);

          // Tooltip preview
          marker.bindTooltip(
            `
              <div style="font-family: inherit; font-size: 11px; line-height: 1.4; max-width: 240px; padding: 2px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px;">
                  <span style="font-weight: 800; color: ${primaryColor}; font-family: monospace;">${zone.code}</span>
                  <span style="font-size: 9px; background: ${isCritical ? '#fee2e2' : '#ffedd5'}; color: ${primaryColor}; padding: 1px 5px; border-radius: 9999px; font-weight: 800; border: 1px solid ${primaryColor}40;">
                    Risk Score: ${zone.riskScore}/100
                  </span>
                </div>
                <div style="font-weight: 700; color: #111827; margin-top: 4px; font-size: 11.5px;">${zone.name}</div>
                <div style="margin-top: 5px; padding: 4px 6px; background: #f9fafb; border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; font-size: 10px; color: #374151;">
                  <div>📊 3-Yr Crash Toll: <strong>${zone.totalRecordedAccidents3Years} incidents (${zone.totalFatalities3Years} fatal)</strong></div>
                  <div>🕒 Peak Danger: <strong>${zone.peakRiskHours.split("(")[0]}</strong></div>
                  <div style="margin-top: 3px; color: #047857; font-weight: 700; display: flex; align-items: center; gap: 3px;">
                    <span>🏛️ Official Sources: Police, Municipal PWD, EMS</span>
                  </div>
                </div>
                <div style="margin-top: 4px; font-size: 9.5px; color: #2563eb; font-weight: 700; text-align: center;">
                  Click marker to view past trends & source logs ➔
                </div>
              </div>
            `,
            { direction: "top", offset: [0, -12], opacity: 0.98 }
          );

          marker.on("click", () => {
            openDrawer("ACCIDENT_ZONE", zone.id);
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

      // 3A. Bus Routes: Fetch turn-by-turn road network geometry
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

              if (roadGeom.latLngs && roadGeom.latLngs.length > 2) {
                totalNodes += roadGeom.latLngs.length;

                const polyline = L.polyline(roadGeom.latLngs, {
                  color: route.color,
                  weight: 4,
                  opacity: 0.85,
                  dashArray: route.status === "DELAYED" ? "6, 6" : undefined,
                }).addTo(routes);

                polyline.bindPopup(`
                  <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
                    <div style="font-weight: bold; color: ${route.color};">${route.routeNumber}</div>
                    <div style="font-weight: 600; color: #191919;">${route.name}</div>
                    <div style="margin-top: 4px; padding: 4px; background: #f7f7f5; border: 1px solid rgba(0,0,0,0.06); border-radius: 3px; font-size: 10px;">
                      <div>🛣️ Road Distance: <strong>${roadGeom.distanceKm} km</strong></div>
                      <div>⏱️ Est. Travel Time: <strong>${roadGeom.durationMin} min</strong></div>
                      <div>📍 Nodes: <strong>${roadGeom.latLngs.length} pts</strong></div>
                    </div>
                  </div>
                `);

                route.stops.forEach((stop) => {
                  const stopIcon = L.divIcon({
                    className: "custom-stop-marker",
                    html: `<div style="width: 7px; height: 7px; border-radius: 50%; background: ${route.color}; border: 1px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.2);"></div>`,
                    iconSize: [7, 7],
                    iconAnchor: [3.5, 3.5],
                  });

                  L.marker([stop.coordinates.lat, stop.coordinates.lng], { icon: stopIcon })
                    .bindPopup(`<b>${stop.name}</b><br/>${route.routeNumber} • Offset: +${stop.scheduledArrivalOffsetMin}m`)
                    .addTo(routes);
                });
              } else {
                failedRoutes++;
              }
            } catch (err) {
              failedRoutes++;
            }
          }
        }
      }

      // 3B. Traffic Corridors
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
                  weight: 5,
                  opacity: 0.65,
                }).addTo(traffic);

                polyline.bindPopup(`
                  <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
                    <div style="font-weight: bold; color: #191919;">${seg.code}: ${seg.name}</div>
                    <div style="margin-top: 4px; padding: 4px; background: #f7f7f5; border: 1px solid rgba(0,0,0,0.06); border-radius: 3px; font-size: 10px;">
                      <div>🛣️ Length: <strong>${segRoadGeom.distanceKm} km</strong></div>
                      <div>⚡ Speed: <strong>${seg.currentSpeedKmh} km/h</strong></div>
                      <div>🚦 Congestion: <strong>${(seg.congestionIndex * 100).toFixed(0)}%</strong></div>
                    </div>
                  </div>
                `);
              }
            } catch (err) {
              console.error(err);
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
              weight: 4.5,
              opacity: 0.9,
              dashArray: "6, 6",
            })
              .bindPopup(`
                <div style="font-family: inherit; font-size: 10px;">
                  <div style="font-weight: bold; color: ${lineColor};">${rec.title}</div>
                  <div>Distance: <strong>${rec.roadDistanceKm} km</strong></div>
                </div>
              `)
              .addTo(detours);
          }
        }
      }

      if (isMounted) {
        if (failedRoutes > 0) {
          setRoutingWarning(`${failedRoutes} routes suppressed`);
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
      className={cn(
        "relative overflow-hidden",
        className,
        isFullscreen && "map-fullscreen-active"
      )}
      style={{
        height: isFullscreen ? "100dvh" : height,
        width: "100%",
        position: isFullscreen ? "fixed" : "relative",
        zIndex: isFullscreen ? 9999 : 0,
      }}
    >
      {/* Fullscreen Mode Top Bar Overlay */}
      {isFullscreen && (
        <>
          <div className="absolute top-0 left-0 right-0 z-[1001] bg-[#ffffff]/95 backdrop-blur-md border-b border-black/[0.07] px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex items-center justify-between shadow-sm h-11 sm:h-12">
            {/* Left: Branding & Responsive Title */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-2">
              <div className="w-5 h-5 rounded bg-gray-950 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                KM
              </div>
              <span className="text-xs font-mono font-bold text-gray-950 truncate">
                <span className="hidden sm:inline">KOPARGAON 2D MAP • FULLSCREEN FOCUS</span>
                <span className="sm:hidden">2D MAP</span>
              </span>
            </div>

            {/* Right: Desktop Layer Controls & Exit Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="hidden md:block">
                <MapLayerControls />
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-2.5 py-1 sm:py-1.5 bg-gray-900 hover:bg-black active:bg-gray-800 text-white rounded-md text-xs font-mono font-semibold flex items-center gap-1.5 touch-press shadow-xs shrink-0"
                title="Exit Fullscreen (Esc)"
                aria-label="Exit Fullscreen"
              >
                <Minimize2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Exit (Esc)</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>

          {/* Mobile Floating Layer Bar at the Bottom */}
          <div className="absolute bottom-3 left-2 right-2 md:hidden z-[1001] flex justify-center pointer-events-none">
            <div className="pointer-events-auto max-w-full">
              <MapLayerControls className="shadow-lg bg-white/95 backdrop-blur-md border-black/[0.1] px-1.5 py-1" />
            </div>
          </div>
        </>
      )}

      {/* Embedded Floating Map Controls & Fullscreen Toggle */}
      <div
        className={cn(
          "absolute right-2.5 sm:right-3 z-[1000] flex flex-col items-end gap-1.5 font-mono text-[10px] transition-all duration-150",
          isFullscreen ? "top-13 sm:top-14" : "top-3"
        )}
      >
        {/* Real Road Routing Status Badge */}
        <div className="bg-[#14151a]/90 backdrop-blur-md text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 font-pixel text-[9px] sm:text-[9.5px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate max-w-[150px] sm:max-w-none">{routingStatus}</span>
        </div>

        {routingWarning && (
          <div className="bg-amber-950/90 backdrop-blur-md text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full shadow-md text-[9px] sm:text-[9.5px] font-mono font-semibold">
            ⚠️ {routingWarning}
          </div>
        )}

        {/* Floating Quick Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Recenter Map Button */}
          <button
            onClick={handleRecenter}
            className="w-8 h-8 bg-white/95 backdrop-blur hover:bg-white text-gray-700 border border-black/[0.06] rounded-full shadow-xs touch-press flex items-center justify-center"
            title="Recenter to Kopargaon"
            aria-label="Recenter map"
          >
            <Compass className="w-4 h-4 text-blue-600" />
          </button>

          {/* Fullscreen Map Toggle Button (shown when not in fullscreen mode) */}
          {allowFullscreen && !isFullscreen && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="px-3 py-1.5 bg-white/95 backdrop-blur hover:bg-white text-gray-800 border border-black/[0.06] rounded-full shadow-xs flex items-center gap-1.5 font-mono text-[10.5px] font-bold touch-press"
              title="Fullscreen Map"
              aria-label="Toggle Fullscreen Map"
            >
              <Maximize2 className="w-3.5 h-3.5 text-gray-700" />
              <span>Fullscreen</span>
            </button>
          )}
        </div>
      </div>

      {/* Map DOM Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
