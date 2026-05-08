import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  MagnifyingGlassIcon, HomeModernIcon,
  AdjustmentsHorizontalIcon, ChevronDownIcon, MapPinIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { useAuth } from '../App';

const CITIES = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Nzérékoré', 'Mamou', 'Boké'];

const RENTAL_TYPES = [
  { value: '', label: 'Tout type' },
  { value: 'entire', label: 'Maison entière' },
  { value: 'private', label: 'Chambre privée' },
  { value: 'shared', label: 'Chambre partagée' },
];

const AMENITIES_LIST = [
  { key: 'wifi', label: 'WiFi', icon: '📶' },
  { key: 'ac', label: 'Climatisation', icon: '❄️' },
  { key: 'parking', label: 'Parking', icon: '🅿️' },
  { key: 'kitchen', label: 'Cuisine', icon: '🍳' },
  { key: 'pool', label: 'Piscine', icon: '🏊' },
];

const TYPE_LABELS = { apartment: 'Appartement', house: 'Maison', villa: 'Villa', studio: 'Studio', room: 'Chambre' };

// Shared input style
const INPUT = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gnYellow/60 focus:border-gnYellow/40 transition-all text-sm';

function HouseCard({ house, favIds, onFavorite }) {
  const { user } = useAuth();
  const images = Array.isArray(house.images) ? house.images : JSON.parse(house.images || '[]');
  const thumb = images[0] || null;
  const isFav = favIds?.has(house.id);

  const handleHeart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite(house.id);
  };

  return (
    <Link to={`/houses/${house.id}`} className="card block group">
      <div className="relative h-52 bg-white/5 overflow-hidden rounded-t-2xl">
        {thumb ? (
          <img src={thumb} alt={house.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HomeModernIcon className="h-16 w-16 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10">
          {TYPE_LABELS[house.type] || house.type}
        </span>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {user && (
            <button
              onClick={handleHeart}
              className="w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/10 hover:scale-110 transition-transform"
            >
              {isFav
                ? <HeartIcon className="h-4 w-4 text-gnRed" />
                : <HeartOutline className="h-4 w-4 text-white" />
              }
            </button>
          )}
          {house.pets_allowed === 1 && (
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-[11px] rounded-full border border-white/10">🐾</span>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-black text-white text-base truncate mb-1">{house.title}</h3>
        <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
          <MapPinIcon className="h-3 w-3 text-gnYellow/60 flex-shrink-0" />
          {house.neighborhood ? `${house.neighborhood}, ` : ''}{house.city}
        </p>
        <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
          <span>{house.bedrooms} ch.</span>
          {house.beds > 0 && <span className="text-gray-700">·</span>}
          {house.beds > 0 && <span>{house.beds} lit{house.beds > 1 ? 's' : ''}</span>}
          <span className="text-gray-700">·</span>
          <span>{house.max_guests} pers. max</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-gnYellow font-black text-lg">{Number(house.price_per_night).toLocaleString()}</span>
            <span className="text-gray-500 text-xs font-bold"> GNF / nuit</span>
          </div>
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider border border-white/10 rounded-lg px-2.5 py-1 group-hover:border-gnYellow/30 group-hover:text-gnYellow/60 transition-colors">
            Voir
          </span>
        </div>
      </div>
    </Link>
  );
}

function Counter({ label, sublabel, value, onChange, min = 0 }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0">
      <div>
        <p className="text-white text-sm font-semibold">{label}</p>
        {sublabel && <p className="text-gray-600 text-xs mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-gnYellow/50 hover:text-gnYellow transition-all disabled:opacity-20 disabled:cursor-not-allowed text-base leading-none"
        >−</button>
        <span className="text-white font-bold w-5 text-center text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-gnYellow/50 hover:text-gnYellow transition-all text-base leading-none"
        >+</button>
      </div>
    </div>
  );
}

function StepCounter({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-gnYellow/50 hover:text-gnYellow transition-all disabled:opacity-20 text-sm leading-none"
      >−</button>
      <span className="text-white font-bold text-sm w-6 text-center">{value === 0 ? 'Tout' : value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-gnYellow/50 hover:text-gnYellow transition-all text-sm leading-none"
      >+</button>
    </div>
  );
}

export default function Houses() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [houses, setHouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [favIds, setFavIds] = useState(new Set());

  const [city, setCity] = useState(searchParams.get('city') || '');
  const [neighborhood, setNeighborhood] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rentalType, setRentalType] = useState('');

  const [showGuests, setShowGuests] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const guestsRef = useRef(null);

  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState(0);
  const [beds, setBeds] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [petsAllowed, setPetsAllowed] = useState(false);

  const totalGuests = adults + children + babies;

  useEffect(() => {
    const handler = (e) => {
      if (guestsRef.current && !guestsRef.current.contains(e.target)) setShowGuests(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchHouses = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 12 };
      if (city) params.city = city;
      if (neighborhood) params.neighborhood = neighborhood;
      if (rentalType) params.rental_type = rentalType;
      if (checkIn) params.check_in = checkIn;
      if (checkOut) params.check_out = checkOut;
      if (totalGuests > 1) params.guests = totalGuests;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (bedrooms > 0) params.bedrooms = bedrooms;
      if (beds > 0) params.beds = beds;
      if (petsAllowed) params.pets_allowed = 'true';
      if (selectedAmenities.length > 0) params.amenities = selectedAmenities;

      const { data } = await axios.get('/api/houses', { params });
      setHouses(data.houses);
      setTotal(data.total);
      setPage(p);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHouses(1); }, []);

  useEffect(() => {
    if (!user) return;
    axios.get('/api/favorites/ids').then(r => setFavIds(new Set(r.data))).catch(() => {});
  }, [user]);

  const handleFavorite = async (houseId) => {
    try {
      const { data } = await axios.post(`/api/favorites/${houseId}`);
      setFavIds(prev => {
        const next = new Set(prev);
        data.favorited ? next.add(houseId) : next.delete(houseId);
        return next;
      });
    } catch { /* ignore */ }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowFilters(false);
    setShowGuests(false);
    fetchHouses(1);
  };

  const toggleAmenity = (key) => {
    setSelectedAmenities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const activeFiltersCount = [
    minPrice, maxPrice, bedrooms > 0, beds > 0, petsAllowed, ...selectedAmenities
  ].filter(Boolean).length;

  const today = new Date().toISOString().split('T')[0];

  const guestsLabel = totalGuests <= 1
    ? '1 voyageur'
    : `${totalGuests} voyageurs`;

  return (
    <div className="min-h-screen bg-luxuryBlack pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight">Annonces</h1>
          <p className="text-gray-600 text-sm mt-1">
            {loading ? '…' : `${total} bien${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* ── Search form ── */}
        <form onSubmit={handleSearch}>

          {/* Top row: search fields */}
          <div className="bg-luxuryDark border border-white/8 rounded-2xl p-1 mb-3 flex flex-wrap gap-px">

            {/* Ville */}
            <div className="flex-1 min-w-[120px] px-4 py-3 flex flex-col gap-1.5 border-r border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ville</label>
              <select value={city} onChange={e => setCity(e.target.value)}
                className="bg-transparent text-white text-sm focus:outline-none cursor-pointer">
                <option value="" className="bg-luxuryDark">Toutes</option>
                {CITIES.map(c => <option key={c} value={c} className="bg-luxuryDark">{c}</option>)}
              </select>
            </div>

            {/* Quartier */}
            <div className="flex-1 min-w-[140px] px-4 py-3 flex flex-col gap-1.5 border-r border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Quartier</label>
              <input
                type="text"
                placeholder="Kipé, Ratoma, Kaloum…"
                value={neighborhood}
                onChange={e => setNeighborhood(e.target.value)}
                className="bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
              />
            </div>

            {/* Arrivée */}
            <div className="flex-1 min-w-[120px] px-4 py-3 flex flex-col gap-1.5 border-r border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Arrivée</label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }}
                className="bg-transparent text-sm text-white focus:outline-none [color-scheme:dark]"
              />
            </div>

            {/* Départ */}
            <div className="flex-1 min-w-[120px] px-4 py-3 flex flex-col gap-1.5 border-r border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Départ</label>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none [color-scheme:dark]"
              />
            </div>

            {/* Voyageurs */}
            <div className="flex-1 min-w-[140px] relative" ref={guestsRef}>
              <button
                type="button"
                onClick={() => setShowGuests(v => !v)}
                className="w-full h-full px-4 py-3 flex flex-col gap-1.5 text-left hover:bg-white/3 rounded-xl transition-colors"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Voyageurs</span>
                <span className="text-white text-sm flex items-center gap-1.5">
                  {guestsLabel}
                  <ChevronDownIcon className={`h-3.5 w-3.5 text-gray-500 transition-transform ${showGuests ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {showGuests && (
                <div className="absolute top-full right-0 mt-2 bg-luxuryDark border border-white/10 rounded-2xl p-4 z-50 shadow-2xl w-72">
                  <Counter label="Adultes" sublabel="13 ans et +" value={adults} onChange={setAdults} min={1} />
                  <Counter label="Enfants" sublabel="2 – 12 ans" value={children} onChange={setChildren} />
                  <Counter label="Bébés" sublabel="Moins de 2 ans" value={babies} onChange={setBabies} />
                  <button
                    type="button"
                    onClick={() => setShowGuests(false)}
                    className="mt-3 w-full py-2 bg-gnYellow text-black text-xs font-black uppercase tracking-widest rounded-xl"
                  >
                    Appliquer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom row: type pills + filters + search */}
          <div className="flex flex-wrap items-center gap-3 mb-3">

            {/* Rental type pills */}
            <div className="flex gap-2 flex-wrap">
              {RENTAL_TYPES.map(rt => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setRentalType(rt.value)}
                  className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${
                    rentalType === rt.value
                      ? 'bg-gnYellow text-black border-gnYellow shadow-[0_4px_16px_rgba(252,209,22,0.25)]'
                      : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 ml-auto">
              {/* Advanced filters toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                  showFilters || activeFiltersCount > 0
                    ? 'border-gnYellow/40 text-gnYellow bg-gnYellow/8'
                    : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                }`}
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="bg-gnYellow text-black rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Search button */}
              <button type="submit" className="btn-primary btn-sm flex items-center gap-2 px-5 py-2.5">
                <MagnifyingGlassIcon className="h-4 w-4" />
                Rechercher
              </button>
            </div>
          </div>

          {/* ── Advanced filters panel ── */}
          {showFilters && (
            <div className="bg-luxuryDark border border-white/8 rounded-2xl p-5 mb-3 space-y-5">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                {/* Prix */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Prix par nuit (GNF)</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                      className={INPUT}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      className={INPUT}
                    />
                  </div>
                </div>

                {/* Chambres & Lits */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Chambres & Lits (min)</p>
                  <div className="flex gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-gray-500 font-semibold">Chambres</span>
                      <StepCounter value={bedrooms} onChange={setBedrooms} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-gray-500 font-semibold">Lits</span>
                      <StepCounter value={beds} onChange={setBeds} />
                    </div>
                  </div>
                </div>

                {/* Équipements */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Équipements</p>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES_LIST.map(a => (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => toggleAmenity(a.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                          selectedAmenities.includes(a.key)
                            ? 'bg-gnYellow text-black border-gnYellow'
                            : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <span>{a.icon}</span> {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Animaux */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div>
                  <p className="text-white text-sm font-bold">Animaux acceptés</p>
                  <p className="text-gray-600 text-xs mt-0.5">Afficher uniquement les logements acceptant les animaux</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPetsAllowed(v => !v)}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
                    petsAllowed ? 'bg-gnYellow' : 'bg-white/10'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${petsAllowed ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}
        </form>

        {/* ── Results ── */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
          </div>
        ) : houses.length === 0 ? (
          <div className="text-center py-24">
            <HomeModernIcon className="h-16 w-16 text-white/10 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg">Aucune annonce trouvée</p>
            <p className="text-gray-700 text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
              {houses.map(h => <HouseCard key={h.id} house={h} favIds={favIds} onFavorite={handleFavorite} />)}
            </div>
            {total > 12 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => fetchHouses(page - 1)}
                  disabled={page <= 1}
                  className="btn-secondary btn-sm disabled:opacity-30"
                >
                  Précédent
                </button>
                <span className="text-gray-500 text-sm font-bold">
                  Page {page} / {Math.ceil(total / 12)}
                </span>
                <button
                  onClick={() => fetchHouses(page + 1)}
                  disabled={page * 12 >= total}
                  className="btn-secondary btn-sm disabled:opacity-30"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
