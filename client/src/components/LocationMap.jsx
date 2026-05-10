import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.divIcon({
  html: `<div style="
    width:28px;height:28px;background:#EAB308;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.5);
  "></div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function LocationMap({ lat, lng }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      style={{ height: '220px', width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <Marker position={[lat, lng]} icon={markerIcon} />
    </MapContainer>
  );
}
