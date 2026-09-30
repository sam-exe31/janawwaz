import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';

/** Pune city centre — default map focus. */
export const PUNE_CENTER: [number, number] = [18.5204, 73.8567];

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; OpenStreetMap contributors';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapPoint extends LatLng {
  id: string | number;
  color?: string;
  radius?: number;
  label?: ReactNode;
}

function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom ?? map.getZoom());
  }, [lat, lng, zoom, map]);
  return null;
}

function ClickCapture({ onPick }: { onPick: (v: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Interactive single-pin picker used on the Report page. Tap the map to drop a pin. */
export function LocationPicker({
  value,
  onChange,
  height = 320,
}: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  height?: number;
}) {
  return (
    <div className="overflow-hidden rounded-input border border-border" style={{ height }}>
      <MapContainer
        center={value ? [value.lat, value.lng] : PUNE_CENTER}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_URL} />
        <ClickCapture onPick={onChange} />
        {value && (
          <>
            <Recenter lat={value.lat} lng={value.lng} />
            <CircleMarker
              center={[value.lat, value.lng]}
              radius={11}
              pathOptions={{ color: '#3346B8', weight: 3, fillColor: '#3346B8', fillOpacity: 0.5 }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}

/** Read-only cluster of coloured points — impact map, heat map, feed locations. */
export function PointsMap({
  points,
  height = 480,
  center = PUNE_CENTER,
  zoom = 12,
}: {
  points: MapPoint[];
  height?: number;
  center?: [number, number];
  zoom?: number;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border" style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_URL} />
        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={p.radius ?? 9}
            pathOptions={{
              color: p.color ?? '#3346B8',
              weight: 2,
              fillColor: p.color ?? '#3346B8',
              fillOpacity: 0.45,
            }}
          >
            {p.label != null && <Popup>{p.label}</Popup>}
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
