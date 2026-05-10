import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.divIcon({
  html: `<div style="
    width:32px;height:32px;background:#EAB308;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function ClickHandler({ onMove }) {
  useMapEvents({ click: e => onMove(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FlyTo({ lat, lng }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    const key = `${lat},${lng}`;
    if (key !== prev.current) {
      prev.current = key;
      map.flyTo([lat, lng], 13, { duration: 1 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapPicker({ lat, lng, onChange }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      style={{ height: '260px', width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      <ClickHandler onMove={onChange} />
      <FlyTo lat={lat} lng={lng} />
      <Marker
        position={[lat, lng]}
        icon={markerIcon}
        draggable
        eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); onChange(p.lat, p.lng); } }}
      />
    </MapContainer>
  );
}
