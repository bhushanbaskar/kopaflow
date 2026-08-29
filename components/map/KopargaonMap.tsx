"use client";

import React, { useEffect, useRef } from "react";
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

interface KopargaonMapProps {
  height?: string;
  selectedEntityId?: string | null;
  onSelectEntity?: (type: "BUS" | "SHIPMENT" | "INCIDENT" | "CHARGER" | "SEGMENT", id: string) => void;
  className?: string;
}

export default function KopargaonMap({
  height = "520px",
  className,
}: KopargaonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{
    buses?: L.LayerGroup;
    routes?: L.LayerGroup;
    traffic?: L.LayerGroup;
    logistics?: L.LayerGroup;
    incidents?: L.LayerGroup;
    ev?: L.LayerGroup;
    infra?: L.LayerGroup;
  }>({});

  const { mapLayers, openDrawer } = useAppStore();

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: [19.8856, 74.4789], // Kopargaon center
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
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Layers dynamically based on data and layer toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { buses, routes, traffic, logistics, incidents, ev, infra } = layerGroupsRef.current;

    // A. Infrastructure Anchors (APMC & Depot)
    if (infra) {
      infra.clearLayers();

      // APMC Main Market Yard
      const apmcIcon = L.divIcon({
        className: "custom-apmc-marker",
        html: `<div style="background:#0f172a; color:#f8fafc; border:2px solid #38bdf8; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:10px; box-shadow:0 2px 4px rgba(0,0,0,0.3);">🏛 APMC KOPARGAON</div>`,
        iconSize: [110, 26],
      });
      L.marker([19.8942, 74.4912], { icon: apmcIcon })
        .bindPopup("<b>APMC Kopargaon Main Market Yard</b><br/>Major trading hub for Onion, Tomato & Grain")
        .addTo(infra);

      // Central Bus Depot
      const depotIcon = L.divIcon({
        className: "custom-station-marker",
        html: `<div style="background:#1e293b; color:#f8fafc; border:2px solid #94a3b8; padding:3px 6px; border-radius:4px; font-weight:bold; font-size:10px; box-shadow:0 2px 4px rgba(0,0,0,0.3);">🏢 CENTRAL BUS DEPOT</div>`,
        iconSize: [120, 26],
      });
      L.marker([19.8812, 74.472], { icon: depotIcon })
        .bindPopup("<b>Kopargaon Bus Depot & Workshop</b><br/>Fleet dispatch, maintenance bays & EV charging hub")
        .addTo(infra);
    }

    // B. Bus Routes Layer
    if (routes) {
      routes.clearLayers();
      if (mapLayers.showRoutes) {
        MOCK_BUS_ROUTES.forEach((route) => {
          const latlngs = route.stops.map((s) => [s.coordinates.lat, s.coordinates.lng] as [number, number]);
          L.polyline(latlngs, {
            color: route.color,
            weight: 4,
            opacity: 0.75,
            dashArray: route.status === "DELAYED" ? "6, 6" : undefined,
          })
            .bindPopup(`<b>${route.routeNumber}</b><br/>${route.name}<br/>Frequency: ${route.frequencyMinutes}m`)
            .addTo(routes);
        });
      }
    }

    // C. Traffic & Road Segments Layer
    if (traffic) {
      traffic.clearLayers();
      if (mapLayers.showTraffic) {
        MOCK_ROAD_SEGMENTS.forEach((seg) => {
          const color =
            seg.congestionLevel === "SEVERE" || seg.status === "BLOCKED"
              ? "#dc2626"
              : seg.congestionLevel === "HIGH"
              ? "#ea580c"
              : seg.congestionLevel === "MODERATE"
              ? "#d97706"
              : "#16a34a";

          L.polyline(seg.coordinates, {
            color,
            weight: 6,
            opacity: 0.6,
          })
            .bindPopup(
              `<b>${seg.code}: ${seg.name}</b><br/>Speed: ${seg.currentSpeedKmh} km/h (Base: ${seg.baselineSpeedKmh})<br/>Congestion: ${(seg.congestionIndex * 100).toFixed(0)}%`
            )
            .addTo(traffic);
        });
      }
    }

    // D. Village Clusters / Agri Logistics Pickup Nodes
    if (logistics) {
      logistics.clearLayers();
      if (mapLayers.showLogistics) {
        MOCK_VILLAGE_CLUSTERS.forEach((cluster) => {
          const nodeIcon = L.divIcon({
            className: "custom-station-marker",
            html: `<div style="background:#065f46; color:#ffffff; border:1px solid #34d399; padding:2px 5px; border-radius:3px; font-size:9px; font-weight:600;">🌾 ${cluster.name}</div>`,
            iconSize: [110, 20],
          });
          L.marker([cluster.centerCoordinates.lat, cluster.centerCoordinates.lng], { icon: nodeIcon })
            .bindPopup(`<b>${cluster.name}</b><br/>Major Crops: ${cluster.majorCommodities.join(", ")}<br/>Active Farmers: ${cluster.activeFarmersCount}`)
            .addTo(logistics);
        });
      }
    }

    // E. Bus Fleet Markers
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

    // F. Road Incidents
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

    // G. EV Charging Stations
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

  return (
    <div
      className={className}
      style={{ height, width: "100%", position: "relative", zIndex: 0 }}
      ref={mapContainerRef}
    />
  );
}
