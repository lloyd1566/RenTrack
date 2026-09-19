"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

const philippinesBounds: L.LatLngBoundsExpression = [
  [4.5, 116.7],
  [21.3, 126.8],
];

const destinations = [
  { name: "Manila", region: "National Capital Region", coordinates: [14.5995, 120.9842] as L.LatLngTuple },
  { name: "Cebu", region: "Central Visayas", coordinates: [10.3157, 123.8854] as L.LatLngTuple },
  { name: "Butuan", region: "Agusan del Norte", coordinates: [8.9475, 125.5406] as L.LatLngTuple },
  { name: "Davao", region: "Davao Region", coordinates: [7.1907, 125.4553] as L.LatLngTuple },
];

function destinationIcon(index: number) {
  return L.divIcon({
    className: "destination-marker-wrapper",
    html: `<span class="destination-marker" style="--marker-delay: ${index * 0.32}s"><span class="destination-marker__pulse"></span><span class="destination-marker__dot"></span></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function DestinationsMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.dataset.leafletMounted === "true") return;

    container.dataset.leafletMounted = "true";
    const map = L.map(container, {
      zoomControl: true,
      scrollWheelZoom: false,
      maxBounds: philippinesBounds,
      maxBoundsViscosity: 1,
      minZoom: 5,
    });

    map.fitBounds(philippinesBounds, { padding: [12, 12] });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(map);

    destinations.forEach((destination, index) => {
      L.marker(destination.coordinates, { icon: destinationIcon(index) })
        .bindPopup(`
          <div style="min-width:128px;text-align:center">
            <p style="margin:0;font-weight:700;color:#0f172a">${destination.name}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#475569">${destination.region}</p>
            <a href="#properties" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#2563eb">View properties</a>
          </div>
        `)
        .addTo(map);
    });

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      container.dataset.leafletMounted = "false";
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="destinations-leaflet-map h-full w-full" aria-label="Interactive map of the Philippines" />
      <style jsx global>{`
        .destinations-leaflet-map {
          animation: map-enter 700ms cubic-bezier(.16, 1, .3, 1) both;
        }
        .destinations-leaflet-map .leaflet-tile-pane {
          animation: map-tiles-enter 900ms ease-out both;
        }
        .destination-marker-wrapper {
          background: transparent;
          border: 0;
        }
        .destination-marker {
          position: relative;
          display: block;
          width: 30px;
          height: 30px;
          cursor: pointer;
          animation: marker-enter 550ms calc(var(--marker-delay) + 120ms) cubic-bezier(.16, 1, .3, 1) both;
        }
        .destination-marker__dot {
          position: absolute;
          inset: 5px;
          border: 3px solid white;
          border-radius: 9999px;
          background: #2563eb;
          box-shadow: 0 3px 10px rgba(30, 64, 175, .55);
          transition: transform 180ms ease, background 180ms ease;
        }
        .destination-marker__pulse {
          position: absolute;
          inset: 2px;
          border-radius: 9999px;
          background: rgba(37, 99, 235, .32);
          animation: marker-pulse 2.4s calc(var(--marker-delay) + 700ms) ease-out infinite;
        }
        .destination-marker:hover .destination-marker__dot {
          transform: scale(1.22);
          background: #1d4ed8;
        }
        @keyframes map-enter {
          from { opacity: 0; transform: scale(.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes map-tiles-enter {
          from { opacity: 0; filter: saturate(.65) contrast(.9); }
          to { opacity: 1; filter: saturate(1.06) contrast(1.02); }
        }
        @keyframes marker-enter {
          from { opacity: 0; transform: scale(.25) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes marker-pulse {
          0% { transform: scale(.65); opacity: .75; }
          75%, 100% { transform: scale(1.65); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .destinations-leaflet-map, .destinations-leaflet-map .leaflet-tile-pane, .destination-marker, .destination-marker__pulse { animation: none; }
        }
      `}</style>
    </>
  );
}
