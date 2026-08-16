import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// Extend Leaflet types for heatmap
declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      minOpacity?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
}

interface GPSDataPoint {
  latitude: number;
  longitude: number;
  intensity?: number;
  timestamp?: number;
  speed?: number;
}

interface GPSHeatmapProps {
  data: GPSDataPoint[];
  height?: string;
  showControls?: boolean;
}

export function GPSHeatmap({ data, height = "500px", showControls = true }: GPSHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [30.0444, 31.2357], // Default to Cairo, Egypt
      zoom: 15,
      zoomControl: showControls,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add football pitch overlay if needed
    const pitchBounds: L.LatLngBoundsExpression = [
      [30.044, 31.235],
      [30.045, 31.236],
    ];

    // Draw pitch outline
    L.rectangle(pitchBounds, {
      color: "#4ade80",
      weight: 2,
      fillOpacity: 0.1,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [showControls]);

  useEffect(() => {
    if (!mapInstanceRef.current || data.length === 0) return;

    // Remove existing heatmap layer
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
    }

    // Prepare heatmap data: [lat, lng, intensity]
    const heatmapData: [number, number, number][] = data.map((point) => [
      point.latitude,
      point.longitude,
      point.intensity || point.speed || 1,
    ]);

    // Create heatmap layer
    const heatLayer = L.heatLayer(heatmapData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.4,
      gradient: {
        0.0: "blue",
        0.3: "cyan",
        0.5: "lime",
        0.7: "yellow",
        1.0: "red",
      },
    });

    heatLayer.addTo(mapInstanceRef.current);
    heatLayerRef.current = heatLayer;

    // Fit map to data bounds
    if (data.length > 0) {
      const bounds = L.latLngBounds(data.map((p) => [p.latitude, p.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [data]);

  return (
    <div className="relative">
      <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-lg overflow-hidden border border-border" />
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm rounded-lg">
          <p className="text-muted-foreground">No GPS data available</p>
        </div>
      )}
    </div>
  );
}

// Movement stats component to accompany heatmap
interface MovementStatsProps {
  data: GPSDataPoint[];
}

export function MovementStats({ data }: MovementStatsProps) {
  if (data.length === 0) return null;

  const totalDistance = data.reduce((sum, point, idx) => {
    if (idx === 0) return 0;
    const prev = data[idx - 1];
    // Haversine formula for distance between GPS coordinates
    const R = 6371e3; // Earth radius in meters
    const φ1 = (prev.latitude * Math.PI) / 180;
    const φ2 = (point.latitude * Math.PI) / 180;
    const Δφ = ((point.latitude - prev.latitude) * Math.PI) / 180;
    const Δλ = ((point.longitude - prev.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return sum + R * c;
  }, 0);

  const avgSpeed = data.reduce((sum, p) => sum + (p.speed || 0), 0) / data.length;
  const maxSpeed = Math.max(...data.map((p) => p.speed || 0));

  return (
    <div className="grid grid-cols-3 gap-4 mt-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">{(totalDistance / 1000).toFixed(2)} km</div>
        <div className="text-sm text-muted-foreground">Total Distance</div>
      </div>
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">{avgSpeed.toFixed(1)} km/h</div>
        <div className="text-sm text-muted-foreground">Avg Speed</div>
      </div>
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">{maxSpeed.toFixed(1)} km/h</div>
        <div className="text-sm text-muted-foreground">Max Speed</div>
      </div>
    </div>
  );
}
