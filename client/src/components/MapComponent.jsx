import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

const GUINEA_CENTER = [10.8, -11.5];
const GUINEA_BOUNDS = [[7.0, -15.2], [12.8, -7.5]]; // SW → NE

function createPriceIcon(price, isActive) {
  const n = Number(price);
  const fmt = n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
    ? `${Math.round(n / 1000)}K`
    : n.toString();
  return L.divIcon({
    html: `<div class="price-pin${isActive ? ' price-pin--active' : ''}">${fmt} GNF</div>`,
    className: '',
    iconAnchor: [36, 18],
    iconSize: [72, 36],
  });
}

function createClusterIcon(cluster) {
  return L.divIcon({
    html: `<div class="map-cluster">${cluster.getChildCount()}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function FlyTo({ target }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!target) return;
    const key = `${target.lat},${target.lng},${target._t || 0}`;
    if (key !== prev.current) {
      prev.current = key;
      map.flyTo([target.lat, target.lng], target.zoom || 12, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

function MapEvents({ onMove }) {
  useMapEvents({
    moveend: (e) => {
      const b = e.target.getBounds();
      onMove({
        sw_lat: b.getSouthWest().lat,
        sw_lng: b.getSouthWest().lng,
        ne_lat: b.getNorthEast().lat,
        ne_lng: b.getNorthEast().lng,
      });
    },
  });
  return null;
}

export default function MapComponent({ houses, hoveredId, onHoverChange, onSearchBounds, flyTo }) {
  const [moved, setMoved] = useState(false);
  const [bounds, setBounds] = useState(null);

  const validHouses = useMemo(
    () => houses.filter(h => h.latitude && h.longitude),
    [houses]
  );

  const handleMove = useCallback((b) => {
    setBounds(b);
    setMoved(true);
  }, []);

  const handleSearchInArea = useCallback(() => {
    if (bounds) {
      onSearchBounds(bounds);
      setMoved(false);
    }
  }, [bounds, onSearchBounds]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={GUINEA_CENTER}
        zoom={7}
        minZoom={6}
        maxZoom={18}
        maxBounds={GUINEA_BOUNDS}
        maxBoundsViscosity={0.85}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <MapEvents onMove={handleMove} />
        <FlyTo target={flyTo} />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          iconCreateFunction={createClusterIcon}
        >
          {validHouses.map(house => {
            const isActive = hoveredId === house.id;
            return (
              <Marker
                key={house.id}
                position={[parseFloat(house.latitude), parseFloat(house.longitude)]}
                icon={createPriceIcon(house.price_per_month || house.price_per_night, isActive)}
                zIndexOffset={isActive ? 1000 : 0}
                eventHandlers={{
                  mouseover: () => onHoverChange(house.id),
                  mouseout: () => onHoverChange(null),
                }}
              >
                <Popup>
                  <HousePopup house={house} />
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {moved && (
        <button
          onClick={handleSearchInArea}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white text-black text-[11px] font-black px-5 py-2.5 rounded-full shadow-xl hover:bg-gnYellow transition-colors whitespace-nowrap"
        >
          Rechercher dans cette zone
        </button>
      )}
    </div>
  );
}

function HousePopup({ house }) {
  const images = Array.isArray(house.images)
    ? house.images
    : JSON.parse(house.images || '[]');
  const thumb = images[0];

  return (
    <Link
      to={`/houses/${house.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-52 no-underline"
    >
      {thumb && (
        <img
          src={thumb}
          alt={house.title}
          className="w-full h-28 object-cover"
        />
      )}
      <div className="p-3 bg-white">
        <p className="font-bold text-xs text-gray-900 truncate">{house.title}</p>
        <p className="text-gray-500 text-[10px] mt-0.5">
          {house.neighborhood ? `${house.neighborhood}, ` : ''}{house.city}
        </p>
        <p className="text-gray-900 font-black text-sm mt-1.5">
          {Number(house.price_per_month || house.price_per_night).toLocaleString()} GNF
          <span className="text-gray-400 font-normal text-[10px]"> / mois</span>
        </p>
      </div>
    </Link>
  );
}
