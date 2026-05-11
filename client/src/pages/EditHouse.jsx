import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import { PhotoIcon, XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';

const MapPicker = lazy(() => import('../components/MapPicker'));

const GUINEA_CITIES = [
  'Conakry', 'Kindia', 'Labé', 'Kankan', 'Nzérékoré', 'Mamou', 'Boké',
  'Guéckédou', 'Macenta', 'Kissidougou', 'Dalaba', 'Siguiri', 'Faranah',
  'Télimélé', 'Pita', 'Forécariah', 'Coyah', 'Fria', 'Dubréka', 'Kérouané',
];

const HOUSE_TYPES = [
  { value: 'apartment', label: 'Appartement', icon: '🏢' },
  { value: 'house', label: 'Maison', icon: '🏠' },
  { value: 'villa', label: 'Villa', icon: '🏡' },
  { value: 'studio', label: 'Studio', icon: '🛋️' },
  { value: 'room', label: 'Chambre', icon: '🛏️' },
];

const RENTAL_TYPES = [
  { value: 'entire', label: 'Logement entier' },
  { value: 'private', label: 'Chambre privée' },
  { value: 'shared', label: 'Chambre partagée' },
];

const AMENITIES = [
  { key: 'wifi', label: 'WiFi', icon: '📶' },
  { key: 'ac', label: 'Climatisation', icon: '❄️' },
  { key: 'parking', label: 'Parking', icon: '🅿️' },
  { key: 'kitchen', label: 'Cuisine', icon: '🍳' },
  { key: 'pool', label: 'Piscine', icon: '🏊' },
  { key: 'tv', label: 'TV', icon: '📺' },
  { key: 'washer', label: 'Machine à laver', icon: '🫧' },
  { key: 'balcony', label: 'Balcon / Terrasse', icon: '🌿' },
  { key: 'garden', label: 'Jardin', icon: '🌳' },
  { key: 'security', label: 'Gardiennage', icon: '🔒' },
];

const INPUT = 'w-full px-4 py-3 bg-white/5 border border-transparent rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gnYellow/40 focus:bg-gnYellow/5 transition-all text-sm';

function Stepper({ label, value, onChange, min = 0, max = 20 }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-300 text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-7 h-7 rounded-full border border-white/15 text-gray-400 hover:border-gnYellow/50 hover:text-gnYellow disabled:opacity-20 transition-all flex items-center justify-center text-base">−</button>
        <span className="text-white font-bold text-sm w-4 text-center">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-7 h-7 rounded-full border border-white/15 text-gray-400 hover:border-gnYellow/50 hover:text-gnYellow disabled:opacity-20 transition-all flex items-center justify-center text-base">+</button>
      </div>
    </div>
  );
}

function CityInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const filtered = value.trim()
    ? GUINEA_CITIES.filter(c => c.toLowerCase().startsWith(value.toLowerCase()))
    : GUINEA_CITIES;
  return (
    <div className="relative">
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Conakry, Kindia…" autoComplete="off" className={INPUT} />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-y-auto max-h-[180px] shadow-xl">
          {filtered.map(c => (
            <li key={c} onMouseDown={() => { onChange(c); setOpen(false); }}
              className="px-4 py-2.5 text-sm text-gray-300 hover:bg-gnYellow/10 hover:text-gnYellow cursor-pointer transition-colors">{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

export default function EditHouse() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [loadingHouse, setLoadingHouse] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [houseType, setHouseType] = useState('apartment');
  const [rentalType, setRentalType] = useState('entire');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [maxGuests, setMaxGuests] = useState(2);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [extraRules, setExtraRules] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [price, setPrice] = useState('');
  const [cautionAmount, setCautionAmount] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [surfaceHouse, setSurfaceHouse] = useState('');
  const [surfaceLand, setSurfaceLand] = useState('');
  const [latitude, setLatitude] = useState(9.6412);
  const [longitude, setLongitude] = useState(-13.5784);

  // Images
  const [existingImages, setExistingImages] = useState([]); // URLs conservées
  const [newImages, setNewImages] = useState([]);            // nouveaux fichiers
  const [newPreviews, setNewPreviews] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get(`/api/houses/${id}`)
      .then(({ data: h }) => {
        if (h.owner_id !== user.id) { navigate(`/houses/${id}`); return; }
        setHouseType(h.type || 'apartment');
        setRentalType(h.rental_type || 'entire');
        setTitle(h.title || '');
        setDescription(h.description || '');
        setCity(h.city || '');
        setNeighborhood(h.neighborhood || '');
        setAddress(h.address || '');
        setBedrooms(h.bedrooms || 1);
        setBeds(h.beds || 1);
        setBathrooms(h.bathrooms || 1);
        setMaxGuests(h.max_guests || 2);
        setPetsAllowed(!!h.pets_allowed);
        setSmokingAllowed(!!h.smoking_allowed);
        setExtraRules(h.extra_rules || '');
        const amenities = Array.isArray(h.amenities) ? h.amenities : JSON.parse(h.amenities || '[]');
        setSelectedAmenities(amenities);
        setPrice(h.price_per_month || h.price_per_night || '');
        setCautionAmount(h.caution_amount || '');
        setAvailableFrom(h.available_from ? h.available_from.split('T')[0] : '');
        setSurfaceHouse(h.surface_house || '');
        setSurfaceLand(h.surface_land || '');
        if (h.latitude) setLatitude(parseFloat(h.latitude));
        if (h.longitude) setLongitude(parseFloat(h.longitude));
        const imgs = Array.isArray(h.images) ? h.images : JSON.parse(h.images || '[]');
        setExistingImages(imgs);
      })
      .catch(() => navigate('/houses'))
      .finally(() => setLoadingHouse(false));
  }, [id, user]);

  const toggleAmenity = (key) =>
    setSelectedAmenities(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const handleNewFiles = (files) => {
    const toAdd = Array.from(files).slice(0, 10 - existingImages.length - newImages.length);
    setNewImages(prev => [...prev, ...toAdd]);
    setNewPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
  };

  const removeExisting = (idx) => setExistingImages(prev => prev.filter((_, i) => i !== idx));
  const removeNew = (idx) => {
    setNewImages(prev => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (!city.trim()) { setError('La ville est obligatoire.'); return; }
    if (!price) { setError('Le loyer mensuel est obligatoire.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('type', houseType);
      fd.append('rental_type', rentalType);
      fd.append('city', city);
      fd.append('neighborhood', neighborhood);
      fd.append('address', address);
      fd.append('price_per_month', price);
      fd.append('bedrooms', bedrooms);
      fd.append('bathrooms', bathrooms);
      fd.append('max_guests', maxGuests);
      if (surfaceHouse) fd.append('surface_house', surfaceHouse);
      if (surfaceLand) fd.append('surface_land', surfaceLand);
      fd.append('pets_allowed', petsAllowed ? 'true' : 'false');
      fd.append('amenities', JSON.stringify(selectedAmenities));
      if (cautionAmount) fd.append('caution_amount', cautionAmount);
      if (availableFrom) fd.append('available_from', availableFrom);
      fd.append('smoking_allowed', smokingAllowed ? 'true' : 'false');
      if (extraRules.trim()) fd.append('extra_rules', extraRules.trim());
      fd.append('latitude', latitude);
      fd.append('longitude', longitude);
      fd.append('existing_images', JSON.stringify(existingImages));
      newImages.forEach(img => fd.append('images', img));

      await axios.put(`/api/houses/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/houses/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la modification.');
    } finally { setLoading(false); }
  };

  if (loadingHouse) return (
    <div className="min-h-screen bg-luxuryBlack flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
    </div>
  );

  const totalImages = existingImages.length + newImages.length;

  return (
    <div className="min-h-screen bg-luxuryBlack pb-24">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 pt-24">

        <div className="mb-8">
          <p className="text-gnYellow text-[10px] font-black uppercase tracking-[0.2em] mb-1">Modifier l'annonce</p>
          <h1 className="text-2xl font-display font-black text-white">Mettre à jour</h1>
        </div>

        {error && (
          <div className="bg-gnRed/10 border border-gnRed/20 text-gnRed rounded-xl p-3 mb-5 text-sm font-semibold">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Type */}
          <Section title="Type de logement">
            <div className="flex flex-wrap gap-2">
              {HOUSE_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setHouseType(t.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                    houseType === t.value ? 'border-gnYellow bg-gnYellow/10 text-gnYellow' : 'border-transparent bg-white/4 text-gray-400 hover:bg-white/8 hover:text-white'
                  }`}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {RENTAL_TYPES.map(rt => (
                <button key={rt.value} type="button" onClick={() => setRentalType(rt.value)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    rentalType === rt.value ? 'border-gnYellow/50 bg-gnYellow/10 text-gnYellow' : 'border-transparent bg-white/4 text-gray-400 hover:bg-white/8'
                  }`}>
                  {rt.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Infos */}
          <Section title="Informations">
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Titre *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={INPUT} maxLength={100} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className={INPUT + ' resize-none'} maxLength={1000} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Ville *</label>
                <CityInput value={city} onChange={setCity} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Quartier</label>
                <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className={INPUT} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Adresse</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={INPUT} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Localisation</label>
                <button type="button" onClick={() => navigator.geolocation?.getCurrentPosition(p => { setLatitude(p.coords.latitude); setLongitude(p.coords.longitude); })}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gnYellow hover:text-gnYellow/70 transition-colors">
                  <MapPinIcon className="h-3.5 w-3.5" /> Ma position
                </button>
              </div>
              <Suspense fallback={<div className="h-[260px] rounded-xl bg-white/4 animate-pulse" />}>
                <MapPicker lat={latitude} lng={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
              </Suspense>
            </div>
          </Section>

          {/* Capacité */}
          <Section title="Capacité & surfaces">
            <div className="bg-white/4 rounded-xl p-4 space-y-4">
              <Stepper label="Chambres" value={bedrooms} onChange={setBedrooms} min={1} />
              <div className="h-px bg-white/5" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1.5">Surface habitable (m²)</label>
                  <input type="number" min="0" value={surfaceHouse} onChange={e => setSurfaceHouse(e.target.value)} placeholder="ex: 120"
                    className="w-full px-3 py-2.5 bg-white/5 border border-transparent rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-gnYellow/40" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1.5">Surface terrain (m²)</label>
                  <input type="number" min="0" value={surfaceLand} onChange={e => setSurfaceLand(e.target.value)} placeholder="ex: 500"
                    className="w-full px-3 py-2.5 bg-white/5 border border-transparent rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-gnYellow/40" />
                </div>
              </div>
              <div className="h-px bg-white/5" />
              <Stepper label="Lits" value={beds} onChange={setBeds} min={1} />
              <div className="h-px bg-white/5" />
              <Stepper label="Salles de bain" value={bathrooms} onChange={setBathrooms} min={1} />
              <div className="h-px bg-white/5" />
              <Stepper label="Voyageurs max" value={maxGuests} onChange={setMaxGuests} min={1} max={30} />
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <p className="text-gray-300 text-sm">Animaux acceptés</p>
                <button type="button" onClick={() => setPetsAllowed(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${petsAllowed ? 'bg-gnYellow' : 'bg-white/10'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${petsAllowed ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </Section>

          {/* Équipements */}
          <Section title="Équipements">
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(a => (
                <button key={a.key} type="button" onClick={() => toggleAmenity(a.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    selectedAmenities.includes(a.key) ? 'border-gnYellow/50 bg-gnYellow/10 text-gnYellow' : 'border-transparent bg-white/4 text-gray-400 hover:bg-white/7 hover:text-white'
                  }`}>
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Règles */}
          <Section title="Règles de la maison">
            <div className="bg-white/4 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-300 text-sm">Fumeur autorisé</p>
                <button type="button" onClick={() => setSmokingAllowed(v => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smokingAllowed ? 'bg-gnYellow' : 'bg-white/10'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${smokingAllowed ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="h-px bg-white/5" />
              <div>
                <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1.5">Règles supplémentaires</label>
                <textarea value={extraRules} onChange={e => setExtraRules(e.target.value)} rows={3} maxLength={500} className={INPUT + ' resize-none'} />
              </div>
            </div>
          </Section>

          {/* Prix */}
          <Section title="Loyer & conditions">
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Loyer mensuel * (GNF)</label>
              <div className="relative">
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className={INPUT + ' pr-14'} min={0} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gnYellow font-black text-xs">GNF</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Caution (GNF) <span className="text-gray-700 normal-case font-normal">(optionnel)</span></label>
              <div className="relative">
                <input type="number" value={cautionAmount} onChange={e => setCautionAmount(e.target.value)} className={INPUT + ' pr-14'} min={0} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gnYellow font-black text-xs">GNF</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Disponible à partir du <span className="text-gray-700 normal-case font-normal">(optionnel)</span></label>
              <input type="date" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} className={INPUT} />
            </div>
          </Section>

          {/* Photos */}
          <Section title={`Photos (${totalImages}/10)`}>
            {(existingImages.length > 0 || newPreviews.length > 0) && (
              <div className="grid grid-cols-3 gap-2">
                {existingImages.map((src, i) => (
                  <div key={'ex-' + i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && newImages.length === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 bg-gnYellow text-black text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">Principale</span>
                    )}
                    <button type="button" onClick={() => removeExisting(i)}
                      className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <XMarkIcon className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                {newPreviews.map((src, i) => (
                  <div key={'new-' + i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={src} alt="" className="w-full h-full object-cover opacity-80" />
                    <span className="absolute bottom-1.5 left-1.5 bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">Nouveau</span>
                    <button type="button" onClick={() => removeNew(i)}
                      className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <XMarkIcon className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {totalImages < 10 && (
              <div onDrop={e => { e.preventDefault(); handleNewFiles(e.dataTransfer.files); }}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border border-dashed border-white/8 hover:border-gnYellow/25 rounded-xl p-6 text-center cursor-pointer transition-colors group">
                <PhotoIcon className="h-8 w-8 text-white/10 group-hover:text-gnYellow/30 mx-auto mb-2 transition-colors" />
                <p className="text-gray-500 text-sm">Ajouter des photos</p>
                <p className="text-gray-700 text-xs mt-0.5">Glissez ou cliquez · Max 5 Mo</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => handleNewFiles(e.target.files)} />
              </div>
            )}
          </Section>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(`/houses/${id}`)}
              className="px-5 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:border-white/20 hover:text-white transition-all">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />Enregistrement…</span>
                : 'Enregistrer les modifications'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
