import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { travelColors } from "../lib/theme";
import type { TripStep } from "../lib/types";

interface TripMapProps {
  steps: TripStep[];
  isActive?: boolean;
  selectedStepId?: string;
  onStepSelect: (stepId: string) => void;
}

type MapStyleId = "quiet" | "voyage" | "osm";

const mapStyles: Array<{
  id: MapStyleId;
  label: string;
  tileUrl: string;
  attribution: string;
}> = [
  {
    id: "quiet",
    label: "Sobre",
    tileUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: "voyage",
    label: "Voyage",
    tileUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: "osm",
    label: "OSM",
    tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
];

function isCoarsePointer() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export function TripMap({ isActive = true, steps, selectedStepId, onStepSelect }: TripMapProps) {
  const [mapStyleId, setMapStyleId] = useState<MapStyleId>("quiet");
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const detailLineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const detailMarkersRef = useRef<L.Marker[]>([]);
  const initialCenter = steps[0]?.coordinates ?? ([0, 0] as [number, number]);
  const activeMapStyle = mapStyles.find((style) => style.id === mapStyleId) ?? mapStyles[0];
  const selectedStep = selectedStepId ? steps.find((step) => step.id === selectedStepId) : undefined;
  const selectedMapPoints = selectedStep?.mapPoints ?? [];

  const routeBounds = useMemo(() => {
    if (steps.length === 0) return undefined;
    return L.latLngBounds(steps.map((step) => step.coordinates));
  }, [steps]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    mapRef.current = L.map(mapNodeRef.current, {
      scrollWheelZoom: !isCoarsePointer(),
      zoomControl: true,
    }).setView(initialCenter, steps.length > 1 ? 5 : 8);

    routeLineRef.current = L.polyline([], {
      color: travelColors.route,
      weight: 4,
      opacity: 0.82,
      dashArray: "9 10",
    }).addTo(mapRef.current);

    detailLineRef.current = L.polyline([], {
      color: travelColors.weekend,
      weight: 4,
      opacity: 0.9,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      routeLineRef.current = null;
      detailLineRef.current = null;
      tileLayerRef.current = null;
      markersRef.current.clear();
      detailMarkersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isActive) return;

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
      if (routeBounds?.isValid()) {
        map.fitBounds(routeBounds, { padding: [36, 36] });
      }
    }, 90);

    return () => window.clearTimeout(resizeTimer);
  }, [isActive, routeBounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const currentMap = map;

    function handleResize() {
      currentMap.invalidateSize();
      if (routeBounds?.isValid()) {
        currentMap.fitBounds(routeBounds, { padding: [36, 36] });
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [routeBounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    tileLayerRef.current = L.tileLayer(activeMapStyle.tileUrl, {
      maxZoom: 19,
      attribution: activeMapStyle.attribution,
    }).addTo(map);
  }, [activeMapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    const routeLine = routeLineRef.current;
    if (!map || !routeLine) return;
    let isMounted = true;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    routeLine.setLatLngs(steps.map((step) => step.coordinates));

    steps.forEach((step, index) => {
      const marker = L.marker(step.coordinates, {
        icon: L.divIcon({
          className: "",
          html: `<div class="marker" style="background:${step.color}">${index + 1}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -14],
        }),
      }).addTo(map);

      const popup = document.createElement("div");
      const title = document.createElement("div");
      const meta = document.createElement("div");
      const transport = document.createElement("div");
      title.className = "popup-title";
      title.textContent = step.label;
      meta.className = "popup-meta";
      meta.textContent = `${step.startDate} - ${step.endDate} | ${step.nights}`;
      transport.textContent = step.transport;
      popup.append(title, meta, transport);

      marker.bindPopup(popup);
      marker.on("click", () => onStepSelect(step.id));
      markersRef.current.set(step.id, marker);
    });

    const resizeTimer = window.setTimeout(() => {
      if (!isMounted || mapRef.current !== map) return;
      map.invalidateSize();
      if (routeBounds?.isValid()) {
        map.fitBounds(routeBounds, { padding: [36, 36] });
      }
    }, 80);

    return () => {
      isMounted = false;
      window.clearTimeout(resizeTimer);
    };
  }, [onStepSelect, routeBounds, steps]);

  useEffect(() => {
    const map = mapRef.current;
    const detailLine = detailLineRef.current;
    if (!map || !detailLine) return;

    detailMarkersRef.current.forEach((marker) => marker.remove());
    detailMarkersRef.current = [];
    detailLine.setLatLngs([]);

    if (!selectedStep) return;

    markersRef.current.get(selectedStep.id)?.openPopup();

    if (selectedMapPoints.length === 0) {
      map.flyTo(selectedStep.coordinates, selectedStep.id === "tainan" ? 8 : 9, { duration: 0.8 });
      return;
    }

    const detailCoordinates = [selectedStep.coordinates, ...selectedMapPoints.map((point) => point.coordinates)];
    detailLine.setLatLngs(detailCoordinates);

    selectedMapPoints.forEach((point, index) => {
      const marker = L.marker(point.coordinates, {
        icon: L.divIcon({
          className: "",
          html: `<div class="detail-marker">${index + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        }),
      }).addTo(map);

      const popup = document.createElement("div");
      const title = document.createElement("div");
      const meta = document.createElement("div");
      const description = document.createElement("div");
      title.className = "popup-title";
      title.textContent = point.label;
      meta.className = "popup-meta";
      meta.textContent = point.date;
      description.textContent = point.description;
      popup.append(title, meta, description);
      marker.bindPopup(popup);
      detailMarkersRef.current.push(marker);
    });

    const detailBounds = L.latLngBounds(detailCoordinates);
    if (detailBounds.isValid()) {
      map.flyToBounds(detailBounds, { duration: 0.8, maxZoom: 13, padding: [42, 42] });
    }
  }, [selectedMapPoints, selectedStep]);

  function fitRoute() {
    const map = mapRef.current;
    if (!map || !routeBounds?.isValid()) return;
    map.invalidateSize();
    map.fitBounds(routeBounds, { padding: [36, 36] });
  }

  return (
    <div className={`map-card map-style-${mapStyleId}`}>
      <div className="map-actions">
        <div className="map-style-switcher" aria-label="Fond de carte">
          {mapStyles.map((style) => (
            <button
              className={mapStyleId === style.id ? "active" : ""}
              key={style.id}
              onClick={() => setMapStyleId(style.id)}
              type="button"
            >
              {style.label}
            </button>
          ))}
        </div>
        <button className="action-btn" onClick={fitRoute} type="button">
          Voir tout le parcours
        </button>
      </div>
      <div id="map" ref={mapNodeRef} aria-label="Carte interactive du parcours" />
    </div>
  );
}
