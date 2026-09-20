"use client";

import { useEffect, useRef } from "react";
import { Map, Marker, NavigationControl, Popup, type Map as MapLibreMap, type LngLatBoundsLike } from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

const philippinesBounds: LngLatBoundsLike = [
  [116.7, 4.5],
  [126.8, 21.3],
];

const destinations = [
  { name: "Manila", region: "National Capital Region", coordinates: [120.9842, 14.5995] as [number, number] },
  { name: "Cebu", region: "Central Visayas", coordinates: [123.8854, 10.3157] as [number, number] },
  { name: "Butuan", region: "Agusan del Norte", coordinates: [125.5406, 8.9475] as [number, number] },
  { name: "Davao", region: "Davao Region", coordinates: [125.4553, 7.1907] as [number, number] },
];

const mapStyle = {
  version: 8 as const,
  sources: {
    openstreetmap: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "openstreetmap",
      type: "raster" as const,
      source: "openstreetmap",
      paint: { "raster-saturation": -0.05, "raster-contrast": 0.04 },
    },
  ],
};

function createDestinationMarker(index: number) {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = "destination-map-marker";
  marker.style.setProperty("--marker-delay", `${index * 120}ms`);
  marker.setAttribute("aria-label", `View properties in ${destinations[index].name}`);
  marker.innerHTML = `<span class="destination-map-marker__pulse"></span><span class="destination-map-marker__dot"></span><span class="destination-map-marker__label">${destinations[index].name}</span>`;
  return marker;
}

export default function DestinationsMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new Map({
      container,
      style: mapStyle,
      center: [121.8, 11.5],
      zoom: 5.5,
      maxBounds: philippinesBounds,
      minZoom: 5,
      maxZoom: 12,
      scrollZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.once("load", () => map.fitBounds(philippinesBounds, { padding: 36, maxZoom: 6.5 }));

    destinations.forEach((destination, index) => {
      const popup = new Popup({ offset: 18, closeButton: true, maxWidth: "220px" }).setHTML(`
        <div class="destination-map-popup">
          <strong>${destination.name}</strong>
          <span>${destination.region}</span>
          <a href="#properties">View properties</a>
        </div>
      `);

      new Marker({ element: createDestinationMarker(index), anchor: "center" })
        .setLngLat(destination.coordinates)
        .setPopup(popup)
        .addTo(map);
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="destinations-map h-full w-full" aria-label="Interactive map of the Philippines" />;
}
