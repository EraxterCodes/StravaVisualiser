"use client";

import { CircleMarker, MapContainer, Polyline, TileLayer } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

/**
 * Leaflet + OpenStreetMap route renderer. Must only ever be mounted on the
 * client (Leaflet touches `window`/`document` at import time) — the parent
 * loads this via `next/dynamic` with `ssr: false`.
 */
export function RouteMap({ coordinates }: { coordinates: [number, number][] }) {
  if (coordinates.length === 0) {
    return null;
  }

  const positions = coordinates as LatLngExpression[];
  const bounds = coordinates as LatLngBoundsExpression;
  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [24, 24] }}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline positions={positions} pathOptions={{ color: "#3987e5", weight: 4, opacity: 0.9 }} />
      <CircleMarker
        center={start}
        radius={6}
        pathOptions={{ color: "#fcfcfb", weight: 2, fillColor: "#199e70", fillOpacity: 1 }}
      />
      <CircleMarker
        center={end}
        radius={6}
        pathOptions={{ color: "#fcfcfb", weight: 2, fillColor: "#e66767", fillOpacity: 1 }}
      />
    </MapContainer>
  );
}
