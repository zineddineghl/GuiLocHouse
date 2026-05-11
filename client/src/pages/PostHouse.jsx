import { useState, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import { PhotoIcon, XMarkIcon, CheckIcon, ChevronRightIcon, MapPinIcon } from '@heroicons/react/24/outline';

const MapPicker = lazy(() => import('../components/MapPicker'));

const CITY_COORDS = {
  'Conakry': [9.6412, -13.5784], 'Kindia': [10.0549, -12.8672],
  'Labé': [11.3181, -12.2845], 'Kankan': [10.3836, -9.3060],
  'Nzérékoré': [7.7561, -8.8204], 'Mamou': [10.3741, -12.0827],
  'Boké': [10.9317, -14.2895], 'Guéckédou': [8.5543, -10.1348],
  'Macenta': [8.5500, -9.4667], 'Kissidougou': [9.1853, -10.0806],
  'Dalaba': [10.6897, -12.2551], 'Siguiri': [11.4167, -9.1667],
  'Faranah': [10.0361, -10.7458], 'Télimélé': [10.9083, -13.0333],
  'Pita': [11.0667, -12.4000], 'Forécariah': [9.4333, -13.0833],
  'Coyah': [9.7000, -13.3833], 'Fria': [10.3667, -13.5500],
  'Dubréka': [9.7889, -13.5142], 'Kérouané': [9.2700, -9.0183],
};

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
  { value: 'entire', label: 'Logement entier', desc: 'Les voyageurs ont le logement pour eux seuls' },
  { value: 'private', label: 'Chambre privée', desc: 'Les voyageurs ont leur propre chambre' },
  { value: 'shared', label: 'Chambre partagée', desc: "Les voyageurs partagent l'espace" },
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

function CityInput({ value, onChange, onCitySelect }) {
  const [open, setOpen] = useState(false);
  const filtered = value.trim()
    ? GUINEA_CITIES.filter(c => c.toLowerCase().startsWith(value.toLowerCase()))
    : GUINEA_CITIES;
  const select = (c) => {
    onChange(c);
    setOpen(false);
    const coords = CITY_COORDS[c];
    if (coords) onCitySelect(coords[0], coords[1]);
  };
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Conakry, Kindia…"
        autoComplete="off"
        className={INPUT}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-y-auto max-h-[180px] shadow-xl">
          {filtered.map(c => (
            <li
              key={c}
              onMouseDown={() => select(c)}
              className="px-4 py-2.5 text-sm text-gray-300 hover:bg-gnYellow/10 hover:text-gnYellow cursor-pointer transition-colors"
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stepper({ label, value, onChange, min = 0, max = 20 }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-300 text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-7 h-7 rounded-full border border-white/15 text-gray-400 hover:border-gnYellow/50 hover:text-gnYellow disabled:opacity-20 transition-all flex items-center justify-center text-base">
          −
        </button>
        <span className="text-white font-bold text-sm w-4 text-center">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-7 h-7 rounded-full border border-white/15 text-gray-400 hover:border-gnYellow/50 hover:text-gnYellow disabled:opacity-20 transition-all flex items-center justify-center text-base">
          +
        </button>
      </div>
    </div>
  );
}

const STEPS = ['Type', 'Infos', 'Capacité', 'Prix & Photos'];

export default function PostHouse() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [latitude, setLatitude] = useState(9.6412);
  const [longitude, setLongitude] = useState(-13.5784);

  const [price, setPrice] = useState('');
  const [cautionAmount, setCautionAmount] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');

  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [extraRules, setExtraRules] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);

  if (!user) { navigate('/login'); return null; }

  const toggleAmenity = (key) =>
    setSelectedAmenities(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const handleFiles = (files) => {
    const newFiles = Array.from(files).slice(0, 10 - images.length);
    setImages(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const next = () => {
    if (step === 2 && !title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (step === 2 && !city.trim()) { setError('La ville est obligatoire.'); return; }
    if (step === 4 && !price) { setError('Le loyer mensuel est obligatoire.'); return; }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price) { setError('Le loyer mensuel est obligatoire.'); return; }
    if (!city.trim()) { setError('La ville est obligatoire.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('title', title); fd.append('description', description);
      fd.append('type', houseType); fd.append('rental_type', rentalType);
      fd.append('city', city); fd.append('neighborhood', neighborhood); fd.append('address', address);
      fd.append('price_per_month', price);
      fd.append('bedrooms', bedrooms);
      fd.append('bathrooms', bathrooms); fd.append('max_guests', maxGuests);
      fd.append('pets_allowed', petsAllowed ? 'true' : 'false');
      fd.append('amenities', JSON.stringify(selectedAmenities));
      if (cautionAmount) fd.append('caution_amount', cautionAmount);
      if (availableFrom) fd.append('available_from', availableFrom);

      fd.append('smoking_allowed', smokingAllowed ? 'true' : 'false');
      if (extraRules.trim()) fd.append('extra_rules', extraRules.trim());
      fd.append('latitude', latitude);
      fd.append('longitude', longitude);
      images.forEach(img => fd.append('images', img));
      const { data } = await axios.post('/api/houses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/houses/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la publication.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-luxuryBlack pb-24">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 pt-24">

        {/* Header */}
        <div className="mb-6">
          <p className="text-gnYellow text-[10px] font-black uppercase tracking-[0.2em] mb-1">Étape {step} / {STEPS.length}</p>
          <h1 className="text-2xl font-display font-black text-white">{STEPS[step - 1]}</h1>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-500 ${
              i < step ? 'bg-gnYellow' : 'bg-white/8'
            }`} />
          ))}
        </div>

        {error && (
          <div className="bg-gnRed/10 border border-gnRed/20 text-gnRed rounded-xl p-3 mb-5 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── STEP 1 : Type ── */}
          {step === 1 && (
            <>
              {/* Type logement */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Type de logement</p>
                <div className="flex flex-wrap gap-2">
                  {HOUSE_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setHouseType(t.value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        houseType === t.value
                          ? 'border-gnYellow bg-gnYellow/10 text-gnYellow'
                          : 'border-transparent bg-white/4 text-gray-400 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <span>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type location */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Type de location</p>
                <div className="space-y-2">
                  {RENTAL_TYPES.map(rt => (
                    <button
                      key={rt.value}
                      type="button"
                      onClick={() => setRentalType(rt.value)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                        rentalType === rt.value
                          ? 'border-gnYellow/50 bg-gnYellow/6'
                          : 'border-transparent bg-white/4 hover:bg-white/7'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        rentalType === rt.value ? 'border-gnYellow bg-gnYellow' : 'border-white/25'
                      }`}>
                        {rentalType === rt.value && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${rentalType === rt.value ? 'text-white' : 'text-gray-300'}`}>
                          {rt.label}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{rt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2 : Infos ── */}
          {step === 2 && (
            <>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Titre *</label>
                <input type="text" placeholder="Belle villa avec piscine à Kipé…" value={title}
                  onChange={e => setTitle(e.target.value)} className={INPUT} maxLength={100} />
                <p className="text-right text-[10px] text-gray-700 mt-1">{title.length}/100</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Description</label>
                <textarea placeholder="Décrivez votre logement, son ambiance…" value={description}
                  onChange={e => setDescription(e.target.value)} rows={4} className={INPUT + ' resize-none'} maxLength={1000} />
                <p className="text-right text-[10px] text-gray-700 mt-1">{description.length}/1000</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Ville *</label>
                  <CityInput value={city} onChange={setCity} onCitySelect={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Quartier</label>
                  <input type="text" placeholder="Kipé, Ratoma…" value={neighborhood}
                    onChange={e => setNeighborhood(e.target.value)} className={INPUT} />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Adresse</label>
                <input type="text" placeholder="Rue, numéro, repère…" value={address}
                  onChange={e => setAddress(e.target.value)} className={INPUT} />
              </div>

              {/* Map picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
                    Localisation exacte
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) return;
                      navigator.geolocation.getCurrentPosition(p => {
                        setLatitude(p.coords.latitude);
                        setLongitude(p.coords.longitude);
                      });
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gnYellow hover:text-gnYellow/70 transition-colors"
                  >
                    <MapPinIcon className="h-3.5 w-3.5" />
                    Ma position
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-2">Cliquez sur la carte ou déplacez le marqueur pour indiquer l'emplacement exact.</p>
                <Suspense fallback={<div className="h-[260px] rounded-xl bg-white/4 animate-pulse" />}>
                  <MapPicker
                    lat={latitude}
                    lng={longitude}
                    onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
                  />
                </Suspense>
              </div>
            </>
          )}

          {/* ── STEP 3 : Capacité ── */}
          {step === 3 && (
            <>
              <div className="bg-white/4 rounded-xl p-4 space-y-4">
                <Stepper label="Chambres" value={bedrooms} onChange={setBedrooms} min={1} />
                <div className="h-px bg-white/5" />
                <Stepper label="Lits" value={beds} onChange={setBeds} min={1} />
                <div className="h-px bg-white/5" />
                <Stepper label="Salles de bain" value={bathrooms} onChange={setBathrooms} min={1} />
                <div className="h-px bg-white/5" />
                <Stepper label="Voyageurs max" value={maxGuests} onChange={setMaxGuests} min={1} max={30} />
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm">Animaux acceptés</p>
                    <p className="text-gray-600 text-xs mt-0.5">Chats, chiens, etc.</p>
                  </div>
                  <button type="button" onClick={() => setPetsAllowed(v => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${petsAllowed ? 'bg-gnYellow' : 'bg-white/10'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${petsAllowed ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Équipements</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map(a => (
                    <button key={a.key} type="button" onClick={() => toggleAmenity(a.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        selectedAmenities.includes(a.key)
                          ? 'border-gnYellow/50 bg-gnYellow/10 text-gnYellow'
                          : 'border-transparent bg-white/4 text-gray-400 hover:bg-white/7 hover:text-white'
                      }`}>
                      <span>{a.icon}</span> {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Règles de la maison */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Règles de la maison</p>
                <div className="bg-white/4 rounded-xl p-4 space-y-4">
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">Fumeur autorisé</p>
                      <p className="text-gray-600 text-xs mt-0.5">Cigarettes, narguilé, etc.</p>
                    </div>
                    <button type="button" onClick={() => setSmokingAllowed(v => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${smokingAllowed ? 'bg-gnYellow' : 'bg-white/10'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${smokingAllowed ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div>
                    <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1.5">Règles supplémentaires</label>
                    <textarea
                      placeholder="Ex : Pas de soirées, animaux de compagnie non acceptés au-delà du 1er étage…"
                      value={extraRules}
                      onChange={e => setExtraRules(e.target.value)}
                      rows={3}
                      maxLength={500}
                      className={INPUT + ' resize-none'}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 4 : Prix & Photos ── */}
          {step === 4 && (
            <>
              {/* Loyer mensuel */}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">Loyer mensuel *</label>
                <div className="relative">
                  <input type="number" placeholder="1 500 000" value={price}
                    onChange={e => setPrice(e.target.value)} className={INPUT + ' pr-14'} min={0} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gnYellow font-black text-xs">GNF</span>
                </div>
                {price && (
                  <p className="text-gnYellow/60 text-xs mt-2 font-medium">
                    {Number(price).toLocaleString('fr-FR')} GNF / mois · charges comprises
                  </p>
                )}
              </div>

              {/* Caution */}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">
                  Caution (dépôt de garantie) <span className="text-gray-700 normal-case font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <input type="number" placeholder="0" value={cautionAmount}
                    onChange={e => setCautionAmount(e.target.value)} className={INPUT + ' pr-14'} min={0} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gnYellow font-black text-xs">GNF</span>
                </div>
                <p className="text-gray-700 text-xs mt-1">Laissez vide si aucune caution n'est requise. Remboursée à la fin du bail.</p>
              </div>

              {/* Date de disponibilité */}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-widest block mb-2">
                  Disponible à partir du <span className="text-gray-700 normal-case font-normal">(optionnel)</span>
                </label>
                <input type="date" value={availableFrom}
                  onChange={e => setAvailableFrom(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={INPUT} />
                <p className="text-gray-700 text-xs mt-1">Laissez vide si le logement est disponible immédiatement.</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">
                  Photos <span className="text-gray-700 normal-case font-normal">({images.length}/10)</span>
                </p>

                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 bg-gnYellow text-black text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            Principale
                          </span>
                        )}
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <XMarkIcon className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < 10 && (
                  <div
                    onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileRef.current?.click()}
                    className="border border-dashed border-white/8 hover:border-gnYellow/25 rounded-xl p-6 text-center cursor-pointer transition-colors group"
                  >
                    <PhotoIcon className="h-8 w-8 text-white/10 group-hover:text-gnYellow/30 mx-auto mb-2 transition-colors" />
                    <p className="text-gray-500 text-sm">Ajouter des photos</p>
                    <p className="text-gray-700 text-xs mt-0.5">Glissez ou cliquez · Max 5 Mo</p>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={e => handleFiles(e.target.files)} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button type="button" onClick={() => { setError(''); setStep(s => s - 1); }}
                className="px-5 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:border-white/20 hover:text-white transition-all">
                Retour
              </button>
            )}
            {step < 4 ? (
              <button type="button" onClick={next}
                className="flex-1 btn-primary flex items-center justify-center gap-2">
                Continuer <ChevronRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />Publication…</span>
                  : "Publier l'annonce"
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
