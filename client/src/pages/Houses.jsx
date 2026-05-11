import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  MagnifyingGlassIcon, HomeModernIcon,
  AdjustmentsHorizontalIcon, ChevronDownIcon, MapPinIcon,
  MapIcon, ListBulletIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { useAuth } from '../App';

const CITIES = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Nzérékoré', 'Mamou', 'Boké'];

const CITY_COORDS = {
  'Conakry':    { lat: 9.6412,  lng: -13.5784, zoom: 12 },
  'Kindia':     { lat: 10.0549, lng: -12.8672, zoom: 12 },
  'Labé':       { lat: 11.3181, lng: -12.2845, zoom: 12 },
  'Kankan':     { lat: 10.3836, lng: -9.3060,  zoom: 12 },
  'Nzérékoré': { lat: 7.7561,  lng: -8.8204,  zoom: 12 },
  'Mamou':      { lat: 10.3741, lng: -12.0827, zoom: 12 },
  'Boké':       { lat: 10.9317, lng: -14.2895, zoom: 12 },
};

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

const SORT_OPTIONS = [
  { value: 'recent',        label: 'Les plus récentes' },
  { value: 'price_asc',     label: 'Prix croissant' },
  { value: 'price_desc',    label: 'Prix décroissant' },
  { value: 'price_m2_asc',  label: 'Prix par m² croissant' },
  { value: 'price_m2_desc', label: 'Prix par m² décroissant' },
  { value: 'rooms_asc',     label: 'Nb de pièces croissant' },
  { value: 'rooms_desc',    label: 'Nb de pièces décroissant' },
  { value: 'surface_asc',   label: 'Surface croissante' },
  { value: 'surface_desc',  label: 'Surface décroissante' },
];

const TYPE_LABELS = { apartment: 'Appartement', house: 'Maison', villa: 'Villa', studio: 'Studio', room: 'Chambre' };
const INPUT = 'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gnYellow/60 focus:border-gnYellow/40 transition-all text-sm';

// ── Sub-components ──────────────────────────────────────────────────────────

function HouseCard({ house, favIds, onFavorite, onHover }) {
  const { user } = useAuth();
  const images = Array.isArray(house.images) ? house.images : JSON.parse(house.images || '[]');
  const thumb = images[0] || null;
  const isFav = favIds?.has(house.id);

  return (
    <Link
      to={`/houses/${house.id}`}
      className="card block group"
      onMouseEnter={() => onHover(house.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="relative h-44 bg-white/5 overflow-hidden rounded-t-2xl">
        {thumb ? (
          <img src={thumb} alt={house.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HomeModernIcon className="h-12 w-12 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/10">
          {TYPE_LABELS[house.type] || house.type}
        </span>
        {user && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite(house.id); }}
            className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/10 hover:scale-110 transition-transform"
          >
            {isFav
              ? <HeartIcon className="h-3.5 w-3.5 text-gnRed" />
              : <HeartOutline className="h-3.5 w-3.5 text-white" />
            }
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-black text-white text-sm truncate mb-0.5">{house.title}</h3>
        <p className="text-gray-500 text-xs mb-2 flex items-center gap-1">
          <MapPinIcon className="h-3 w-3 text-gnYellow/60 flex-shrink-0" />
          {house.neighborhood ? `${house.neighborhood}, ` : ''}{house.city}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-gnYellow font-black text-base">{Number(house.price_per_month || house.price_per_night).toLocaleString()}</span>
            <span className="text-gray-500 text-[11px] font-bold"> GNF / mois</span>
          </div>
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider border border-white/10 rounded-lg px-2 py-0.5 group-hover:border-gnYellow/30 group-hover:text-gnYellow/60 transition-colors">
            Voir
          </span>
        </div>
      </div>
    </Link>
  );
}

function Counter({ label, sublabel, value, onChange, min = 0 }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-white text-sm font-semibold">{label}</p>
        {sublabel && <p className="text-gray-600 text-xs mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-gnYellow/50 hover:text-gnYellow transition-all disabled:opacity-20 disabled:cursor-not-allowed text-sm leading-none">−</button>
        <span className="text-white font-bold w-5 text-center text-sm">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-gnYellow/50 hover:text-gnYellow transition-all text-sm leading-none">+</button>
      </div>
    </div>
  );
}

function StepCounter({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0}
        className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-gnYellow/50 hover:text-gnYellow transition-all disabled:opacity-20 text-sm leading-none">−</button>
      <span className="text-white font-bold text-sm w-5 text-center">{value === 0 ? 'Tout' : value}</span>
      <button type="button" onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white hover:border-gnYellow/50 hover:text-gnYellow transition-all text-sm leading-none">+</button>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function Houses() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [houses, setHouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [favIds, setFavIds] = useState(new Set());

  // shared hover state between list ↔ map
  const [hoveredId, setHoveredId] = useState(null);
  // mobile: show map or list
  const [showMap, setShowMap] = useState(false);
  // desktop: show map panel or not
  const [showMapDesktop, setShowMapDesktop] = useState(true);
  // fly-to city on search
  const [mapFlyTo, setMapFlyTo] = useState(null);

  const [city, setCity] = useState(searchParams.get('city') || '');
  const [neighborhood, setNeighborhood] = useState('');

  const [rentalType, setRentalType] = useState('');

  const [showGuests, setShowGuests] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const guestsRef = useRef(null);

  const [sortBy, setSortBy] = useState('recent');
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef(null);
  const sortMountedRef = useRef(false);

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
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!sortMountedRef.current) { sortMountedRef.current = true; return; }
    fetchHouses(1);
  }, [sortBy]);

  const fetchHouses = async (p = 1, extraParams = {}) => {
    setLoading(true);
    try {
      const params = { page: p, limit: extraParams.sw_lat ? 100 : 12 };
      if (city) params.city = city;
      if (neighborhood) params.neighborhood = neighborhood;
      if (rentalType) params.rental_type = rentalType;

      if (totalGuests > 1) params.guests = totalGuests;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (bedrooms > 0) params.bedrooms = bedrooms;
      if (beds > 0) params.beds = beds;
      if (petsAllowed) params.pets_allowed = 'true';
      if (selectedAmenities.length > 0) params.amenities = selectedAmenities;
      if (sortBy && sortBy !== 'recent') params.sort_by = sortBy;
      Object.assign(params, extraParams);

      const { data } = await axios.get('/api/houses', { params });
      setHouses(data.houses);
      setTotal(data.total);
      setPage(p);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouses(1);
    const initialCity = searchParams.get('city');
    if (initialCity && CITY_COORDS[initialCity]) {
      setMapFlyTo({ ...CITY_COORDS[initialCity], _t: Date.now() });
    }
  }, []);

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
    } catch { }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowFilters(false);
    setShowGuests(false);
    fetchHouses(1);
    if (city && CITY_COORDS[city]) {
      setMapFlyTo({ ...CITY_COORDS[city], _t: Date.now() });
    }
  };

  const handleSearchBounds = useCallback((bounds) => {
    fetchHouses(1, bounds);
  }, [city, neighborhood, rentalType, totalGuests, minPrice, maxPrice, bedrooms, beds, petsAllowed, selectedAmenities]);

  const toggleAmenity = (key) => {
    setSelectedAmenities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const activeFiltersCount = [minPrice, maxPrice, bedrooms > 0, beds > 0, petsAllowed, ...selectedAmenities].filter(Boolean).length;
  const today = new Date().toISOString().split('T')[0];
  const guestsLabel = totalGuests <= 1 ? '1 voyageur' : `${totalGuests} voyageurs`;

  return (
    <div className="h-screen flex flex-col bg-luxuryBlack overflow-hidden">
      <Navbar />

      {/* Content area — offset for fixed navbar (h-16 = 64px) */}
      <div className="flex flex-col flex-1 overflow-hidden pt-16">

        {/* ── Search bar ── */}
        <div className="flex-shrink-0 bg-luxuryBlack border-b border-white/5 px-4 py-3">
          <form onSubmit={handleSearch}>

            {/* Top row */}
            <div className="bg-luxuryDark border border-white/8 rounded-2xl p-0.5 mb-2 flex flex-wrap gap-px">

              {/* Ville */}
              <div className="flex-1 min-w-[100px] px-3 py-2 flex flex-col gap-1 border-r border-white/5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Ville</label>
                <select value={city} onChange={e => setCity(e.target.value)}
                  className="bg-transparent text-white text-xs focus:outline-none cursor-pointer">
                  <option value="" className="bg-luxuryDark">Toutes</option>
                  {CITIES.map(c => <option key={c} value={c} className="bg-luxuryDark">{c}</option>)}
                </select>
              </div>

              {/* Quartier */}
              <div className="flex-1 min-w-[120px] px-3 py-2 flex flex-col gap-1 border-r border-white/5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Quartier</label>
                <input type="text" placeholder="Kipé, Ratoma…" value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  className="bg-transparent text-white text-xs placeholder-gray-600 focus:outline-none" />
              </div>


              {/* Voyageurs */}
              <div className="flex-1 min-w-[120px] relative" ref={guestsRef}>
                <button type="button" onClick={() => setShowGuests(v => !v)}
                  className="w-full h-full px-3 py-2 flex flex-col gap-1 text-left hover:bg-white/3 rounded-xl transition-colors">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Voyageurs</span>
                  <span className="text-white text-xs flex items-center gap-1">
                    {guestsLabel}
                    <ChevronDownIcon className={`h-3 w-3 text-gray-500 transition-transform ${showGuests ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {showGuests && (
                  <div className="absolute top-full right-0 mt-1 bg-luxuryDark border border-white/10 rounded-2xl p-4 z-50 shadow-2xl w-64">
                    <Counter label="Adultes" sublabel="13 ans et +" value={adults} onChange={setAdults} min={1} />
                    <Counter label="Enfants" sublabel="2 – 12 ans" value={children} onChange={setChildren} />
                    <Counter label="Bébés" sublabel="Moins de 2 ans" value={babies} onChange={setBabies} />
                    <button type="button" onClick={() => setShowGuests(false)}
                      className="mt-3 w-full py-2 bg-gnYellow text-black text-xs font-black uppercase tracking-widest rounded-xl">
                      Appliquer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type pills */}
              <div className="flex gap-1.5 flex-wrap">
                {RENTAL_TYPES.map(rt => (
                  <button key={rt.value} type="button" onClick={() => setRentalType(rt.value)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                      rentalType === rt.value
                        ? 'bg-gnYellow text-black border-gnYellow'
                        : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                    }`}>
                    {rt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 ml-auto">
                {/* Sort dropdown */}
                <div className="relative" ref={sortRef}>
                  <button type="button" onClick={() => setShowSort(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      showSort || sortBy !== 'recent'
                        ? 'border-gnYellow/40 text-gnYellow bg-gnYellow/8'
                        : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                    }`}>
                    Sélection
                    <ChevronDownIcon className={`h-3 w-3 transition-transform ${showSort ? 'rotate-180' : ''}`} />
                  </button>
                  {showSort && (
                    <div className="absolute top-full right-0 mt-1 bg-luxuryDark border border-white/10 rounded-2xl py-1 z-50 shadow-2xl w-52">
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                            sortBy === opt.value
                              ? 'text-gnYellow bg-gnYellow/8'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filters toggle */}
                <button type="button" onClick={() => setShowFilters(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    showFilters || activeFiltersCount > 0
                      ? 'border-gnYellow/40 text-gnYellow bg-gnYellow/8'
                      : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                  }`}>
                  <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <span className="bg-gnYellow text-black rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <button type="submit" className="btn-primary btn-sm flex items-center gap-1.5 px-4 py-2">
                  <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                  Rechercher
                </button>

                {/* Desktop map toggle */}
                <button
                  type="button"
                  onClick={() => setShowMapDesktop(v => !v)}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-white/25 hover:text-white transition-all"
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  {showMapDesktop ? 'Masquer' : 'Carte'}
                </button>
              </div>
            </div>

            {/* Advanced filters */}
            {showFilters && (
              <div className="bg-luxuryDark border border-white/8 rounded-2xl p-4 mt-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Prix / mois (GNF)</p>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className={INPUT} />
                      <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className={INPUT} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Chambres & Lits (min)</p>
                    <div className="flex gap-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-gray-500 font-semibold">Chambres</span>
                        <StepCounter value={bedrooms} onChange={setBedrooms} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-gray-500 font-semibold">Lits</span>
                        <StepCounter value={beds} onChange={setBeds} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Équipements</p>
                    <div className="flex flex-wrap gap-1.5">
                      {AMENITIES_LIST.map(a => (
                        <button key={a.key} type="button" onClick={() => toggleAmenity(a.key)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            selectedAmenities.includes(a.key)
                              ? 'bg-gnYellow text-black border-gnYellow'
                              : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                          }`}>
                          {a.icon} {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div>
                    <p className="text-white text-sm font-bold">Animaux acceptés</p>
                    <p className="text-gray-600 text-xs">Uniquement les logements acceptant les animaux</p>
                  </div>
                  <button type="button" onClick={() => setPetsAllowed(v => !v)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${petsAllowed ? 'bg-gnYellow' : 'bg-white/10'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${petsAllowed ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ── Split: List + Map ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: results list */}
          <div className={`flex-col overflow-y-auto ${showMap ? 'hidden lg:flex' : 'flex'} ${showMapDesktop ? 'lg:w-[45%] xl:w-[42%]' : 'lg:w-full'}`}>
            <div className="px-4 pt-3 pb-1 flex-shrink-0">
              <p className="text-gray-600 text-xs font-bold">
                {loading ? '…' : `${total} bien${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="px-4 pb-6">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gnYellow" />
                </div>
              ) : houses.length === 0 ? (
                <div className="text-center py-20">
                  <HomeModernIcon className="h-12 w-12 text-white/10 mx-auto mb-3" />
                  <p className="text-gray-500 font-bold">Aucune annonce trouvée</p>
                  <p className="text-gray-700 text-sm mt-1">Modifiez vos filtres</p>
                </div>
              ) : (
                <>
                  <div className={`grid gap-4 mt-2 grid-cols-1 sm:grid-cols-2 ${showMapDesktop ? 'lg:grid-cols-1 xl:grid-cols-2' : 'lg:grid-cols-3 xl:grid-cols-4'}`}>
                    {houses.map(h => (
                      <HouseCard
                        key={h.id}
                        house={h}
                        favIds={favIds}
                        onFavorite={handleFavorite}
                        onHover={setHoveredId}
                      />
                    ))}
                  </div>
                  {total > 12 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                      <button onClick={() => fetchHouses(page - 1)} disabled={page <= 1}
                        className="btn-secondary btn-sm disabled:opacity-30">Précédent</button>
                      <span className="text-gray-500 text-xs font-bold">
                        Page {page} / {Math.ceil(total / 12)}
                      </span>
                      <button onClick={() => fetchHouses(page + 1)} disabled={page * 12 >= total}
                        className="btn-secondary btn-sm disabled:opacity-30">Suivant</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right: map */}
          <div className={`flex-1 relative ${showMap ? 'flex' : 'hidden'} ${showMapDesktop ? 'lg:flex' : 'lg:hidden'}`}>
            <MapComponent
              houses={houses}
              hoveredId={hoveredId}
              onHoverChange={setHoveredId}
              onSearchBounds={handleSearchBounds}
              flyTo={mapFlyTo}
            />
          </div>
        </div>
      </div>

      {/* Mobile toggle button */}
      <button
        onClick={() => setShowMap(v => !v)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2 bg-white text-black text-xs font-black px-5 py-3 rounded-full shadow-2xl hover:bg-gnYellow transition-colors"
      >
        {showMap
          ? <><ListBulletIcon className="h-4 w-4" /> Voir la liste</>
          : <><MapIcon className="h-4 w-4" /> Voir la carte</>
        }
      </button>
    </div>
  );
}
