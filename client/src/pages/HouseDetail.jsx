import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import { HomeModernIcon, UsersIcon, MapPinIcon, PhoneIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon, LockClosedIcon, TrashIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

const LocationMap = lazy(() => import('../components/LocationMap'));

const TYPE_LABELS = { apartment: 'Appartement', house: 'Maison', villa: 'Villa', studio: 'Studio', room: 'Chambre' };

function ContactButton({ houseId, navigate }) {
  const [loading, setLoading] = useState(false);
  const start = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post('/api/messages/conversations', { house_id: houseId });
      navigate(`/messages/${data.id}`);
    } catch { setLoading(false); }
  };
  return (
    <button onClick={start} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-gnYellow/30 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors">
      <ChatBubbleLeftRightIcon className="h-4 w-4 text-gnYellow" />
      {loading ? '...' : 'Contacter'}
    </button>
  );
}

export default function HouseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [durationMonths, setDurationMonths] = useState(1);
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [availRanges, setAvailRanges] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockForm, setBlockForm] = useState({ start_date: '', end_date: '' });
  const [blockLoading, setBlockLoading] = useState(false);

  const [cohosts, setCohosts] = useState([]);
  const [cohostEmail, setCohostEmail] = useState('');
  const [cohostLoading, setCohostLoading] = useState(false);
  const [cohostError, setCohostError] = useState('');

  const images = house ? (Array.isArray(house.images) ? house.images : JSON.parse(house.images || '[]')) : [];

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setImgIdx(i => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setImgIdx(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, images?.length]);

  useEffect(() => {
    axios.get('/api/houses/' + id)
      .then(r => setHouse(r.data))
      .catch(() => navigate('/houses'))
      .finally(() => setLoading(false));
    axios.get(`/api/houses/${id}/availability`)
      .then(r => setAvailRanges(r.data.ranges || []))
      .catch(() => {});
    axios.get(`/api/houses/${id}/cohosts`)
      .then(r => setCohosts(r.data))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (house && (user?.id === house.owner_id || cohosts.some(c => c.id === user?.id))) {
      axios.get(`/api/houses/${id}/blocked-dates`)
        .then(r => {
          setBlockedDates(r.data);
          setAvailRanges(prev => [
            ...prev.filter(r => r.type !== 'blocked'),
            ...r.data.map(b => ({ ...b, type: 'blocked' })),
          ]);
        })
        .catch(() => {});
    }
  }, [house, user, cohosts]);

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!blockForm.start_date || !blockForm.end_date) return;
    setBlockLoading(true);
    try {
      const { data } = await axios.post(`/api/houses/${id}/blocked-dates`, blockForm);
      setBlockedDates(prev => [...prev, data]);
      setAvailRanges(prev => [...prev, { ...data, type: 'blocked' }]);
      setBlockForm({ start_date: '', end_date: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally { setBlockLoading(false); }
  };

  const handleRemoveBlock = async (blockId) => {
    await axios.delete(`/api/houses/${id}/blocked-dates/${blockId}`);
    setBlockedDates(prev => prev.filter(b => b.id !== blockId));
    setAvailRanges(prev => prev.filter(r => !(r.type === 'blocked' && r.id === blockId)));
  };

  if (loading) return (
    <div className="min-h-screen bg-luxuryBlack flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
    </div>
  );
  if (!house) return null;

  const isOwner = user?.id === house.owner_id;
  const isCohost = cohosts.some(c => c.id === user?.id);

  const handleAddCohost = async (e) => {
    e.preventDefault();
    if (!cohostEmail.trim()) return;
    setCohostLoading(true); setCohostError('');
    try {
      const { data } = await axios.post(`/api/houses/${id}/cohosts`, { email: cohostEmail.trim() });
      setCohosts(prev => [...prev, data]);
      setCohostEmail('');
    } catch (err) {
      setCohostError(err.response?.data?.error || 'Erreur');
    } finally { setCohostLoading(false); }
  };

  const handleRemoveCohost = async (userId) => {
    await axios.delete(`/api/houses/${id}/cohosts/${userId}`);
    setCohosts(prev => prev.filter(c => c.id !== userId));
  };
  const pricePerMonth = house.price_per_month || house.price_per_night || 0;
  const total = pricePerMonth * durationMonths;

  // Calculer la date de fin estimée
  const estimatedEndDate = (() => {
    if (!startDate) return null;
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + durationMonths);
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  })();

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!startDate) { setBookingError('Veuillez choisir une date d\'entrée.'); return; }
    setBookingError('');
    setBookingLoading(true);
    try {
      await axios.post('/api/bookings', { house_id: house.id, start_date: startDate, duration_months: durationMonths, guests, message });
      setBookingSuccess(true);
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Erreur reservation');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxuryBlack pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <Link to="/houses" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 transition-colors">
          <ChevronLeftIcon className="h-4 w-4" /> Retour
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-white/5 aspect-video">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[imgIdx]} alt={house.title}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full">
                        <ChevronLeftIcon className="h-5 w-5 text-white" />
                      </button>
                      <button onClick={() => setImgIdx(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full">
                        <ChevronRightIcon className="h-5 w-5 text-white" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button key={i} onClick={() => setImgIdx(i)} className={`w-2 h-2 rounded-full ${i === imgIdx ? 'bg-gnYellow' : 'bg-white/40'}`} />
                        ))}
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-bold hover:bg-black/90 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                    {images.length} photo{images.length > 1 ? 's' : ''}
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <HomeModernIcon className="h-24 w-24 text-white/10" />
                </div>
              )}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
              <div className="fixed inset-0 z-[900] bg-black/95 flex flex-col" onClick={() => setLightboxOpen(false)}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <span className="text-white/60 text-sm font-bold">{imgIdx + 1} / {images.length}</span>
                  <button onClick={() => setLightboxOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Image principale */}
                <div className="flex-1 flex items-center justify-center relative px-12 min-h-0" onClick={e => e.stopPropagation()}>
                  <img src={images[imgIdx]} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)} className="absolute left-2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronLeftIcon className="h-6 w-6 text-white" />
                      </button>
                      <button onClick={() => setImgIdx(i => (i + 1) % images.length)} className="absolute right-2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronRightIcon className="h-6 w-6 text-white" />
                      </button>
                    </>
                  )}
                </div>

                {/* Miniatures */}
                {images.length > 1 && (
                  <div className="flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-gnYellow' : 'border-transparent opacity-50 hover:opacity-80'}`}
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gnYellow uppercase tracking-widest">{TYPE_LABELS[house.type] || house.type}</span>
                    <button
                      onClick={() => {
                        const url = window.location.href;
                        const msg = `🏠 *${house.title}*\n📍 ${house.neighborhood ? house.neighborhood + ', ' : ''}${house.city}\n💰 ${Number(pricePerMonth).toLocaleString()} GNF/mois\n👉 ${url}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors text-[#25D366] text-[10px] font-bold"
                      title="Partager sur WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#25D366]">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Partager
                    </button>
                  </div>
                  <h1 className="text-2xl font-black text-white mt-1">{house.title}</h1>
                  <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-1">
                    <MapPinIcon className="h-4 w-4" />
                    {house.neighborhood ? house.neighborhood + ', ' : ''}{house.city}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-gnYellow font-black text-2xl">{Number(pricePerMonth).toLocaleString()}</span>
                  <span className="text-gray-500 text-xs font-bold block">GNF / mois</span>
                  {house.available_from && (
                    <span className="text-gray-600 text-[10px] block mt-0.5">
                      Dispo. {new Date(house.available_from).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 py-4 border-y border-white/5">
                <span className="flex items-center gap-2 text-sm text-gray-400"><HomeModernIcon className="h-4 w-4 text-gnYellow" />{house.bedrooms} chambre{house.bedrooms > 1 ? 's' : ''}</span>
                <span className="flex items-center gap-2 text-sm text-gray-400"><HomeModernIcon className="h-4 w-4 text-gnYellow" />{house.bathrooms} salle{house.bathrooms > 1 ? 's' : ''} de bain</span>
                <span className="flex items-center gap-2 text-sm text-gray-400"><UsersIcon className="h-4 w-4 text-gnYellow" />{house.max_guests} personnes max</span>
                {house.surface_house && <span className="flex items-center gap-2 text-sm text-gray-400"><HomeModernIcon className="h-4 w-4 text-gnYellow" />{house.surface_house} m² habitable</span>}
                {house.surface_land && <span className="flex items-center gap-2 text-sm text-gray-400"><HomeModernIcon className="h-4 w-4 text-gnYellow" />{house.surface_land} m² terrain</span>}
              </div>
              {house.description && (
                <div className="mt-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Description</h3>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{house.description}</p>
                </div>
              )}
            </div>

            {(house.smoking_allowed != null || house.pets_allowed != null || house.extra_rules) && (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Règles de la maison</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={house.smoking_allowed ? 'text-green-400' : 'text-red-400'}>{house.smoking_allowed ? '✓' : '✗'}</span>
                    <span className="text-gray-300">{house.smoking_allowed ? 'Fumeur autorisé' : 'Non-fumeur'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={house.pets_allowed ? 'text-green-400' : 'text-red-400'}>{house.pets_allowed ? '✓' : '✗'}</span>
                    <span className="text-gray-300">{house.pets_allowed ? 'Animaux acceptés' : 'Animaux non acceptés'}</span>
                  </div>
                </div>
                {house.extra_rules && (
                  <p className="text-gray-500 text-xs leading-relaxed border-t border-white/5 pt-3">{house.extra_rules}</p>
                )}
              </div>
            )}

            {house.latitude && house.longitude && (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Localisation</h3>
                <Suspense fallback={<div className="h-[220px] rounded-xl bg-white/4 animate-pulse" />}>
                  <LocationMap lat={parseFloat(house.latitude)} lng={parseFloat(house.longitude)} />
                </Suspense>
                <p className="text-gray-500 text-xs mt-3 flex items-center gap-1.5">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {house.neighborhood ? house.neighborhood + ', ' : ''}{house.city}
                </p>
              </div>
            )}

            {/* Availability calendar */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <AvailabilityCalendar bookedRanges={availRanges} availableFrom={house.available_from} />
            </div>

            {/* Owner / co-hôte : block dates */}
            {(isOwner || isCohost) && (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <LockClosedIcon className="h-3.5 w-3.5" /> Bloquer des dates
                </h3>
                <form onSubmit={handleBlockSubmit} className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Début</label>
                      <input type="date" required value={blockForm.start_date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setBlockForm(p => ({ ...p, start_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-gnYellow/30" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-600 font-bold uppercase tracking-widest block mb-1">Fin</label>
                      <input type="date" required value={blockForm.end_date}
                        min={blockForm.start_date || new Date().toISOString().split('T')[0]}
                        onChange={e => setBlockForm(p => ({ ...p, end_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-gnYellow/30" />
                    </div>
                  </div>
                  <button type="submit" disabled={blockLoading}
                    className="w-full py-2 bg-orange-400/10 border border-orange-400/20 text-orange-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-orange-400/20 transition-colors disabled:opacity-50">
                    {blockLoading ? '...' : 'Bloquer ces dates'}
                  </button>
                </form>
                {blockedDates.length > 0 && (
                  <div className="space-y-2">
                    {blockedDates.map(b => (
                      <div key={b.id} className="flex items-center justify-between bg-orange-400/5 border border-orange-400/15 rounded-xl px-3 py-2">
                        <span className="text-orange-400 text-xs font-semibold">{b.start_date} → {b.end_date}</span>
                        <button onClick={() => handleRemoveBlock(b.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                Propriétaire{cohosts.length > 0 ? ' & Co-hôtes' : ''}
              </h3>

              {/* Propriétaire */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gnYellow/10 border border-gnYellow/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-gnYellow font-black text-lg">{house.owner_name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white">{house.owner_name}</p>
                    {house.owner_is_verified && (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-gnGreen/15 text-gnGreen border border-gnGreen/20">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Vérifié
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gnYellow font-bold uppercase tracking-wider mt-0.5">Propriétaire</p>
                  {house.owner_phone && (
                    <a href={'tel:' + house.owner_phone} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gnYellow mt-1">
                      <PhoneIcon className="h-3.5 w-3.5" />{house.owner_phone}
                    </a>
                  )}
                </div>
                {!isOwner && !isCohost && user && (
                  <ContactButton houseId={house.id} navigate={navigate} />
                )}
              </div>

              {/* Co-hôtes */}
              {cohosts.length > 0 && (
                <div className="mt-4 space-y-3 pt-4 border-t border-white/5">
                  {cohosts.map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-300 font-bold text-sm">{c.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200">{c.name}</p>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Co-hôte</p>
                      </div>
                      {isOwner && (
                        <button onClick={() => handleRemoveCohost(c.id)}
                          className="text-gray-700 hover:text-red-400 transition-colors">
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Panel ajout co-hôte (owner uniquement) */}
              {isOwner && (
                <form onSubmit={handleAddCohost} className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2">Ajouter un co-hôte</p>
                  {cohostError && <p className="text-red-400 text-xs mb-2">{cohostError}</p>}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="email@exemple.com"
                      value={cohostEmail}
                      onChange={e => setCohostEmail(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-xs placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-gnYellow/30"
                    />
                    <button type="submit" disabled={cohostLoading}
                      className="px-3 py-2 bg-gnYellow/10 border border-gnYellow/20 text-gnYellow text-xs font-black rounded-xl hover:bg-gnYellow/20 transition-colors disabled:opacity-50">
                      {cohostLoading ? '...' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 sticky top-24">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-gnYellow font-black text-2xl">{Number(pricePerMonth).toLocaleString()}</span>
                <span className="text-gray-500 text-sm font-bold">GNF / mois</span>
              </div>
              <p className="text-gray-600 text-xs mb-5">Charges comprises · Paiement direct</p>
              {(isOwner || isCohost) ? (
                <div className="space-y-2">
                  {isOwner && (
                    <Link to={`/houses/${house.id}/edit`}
                      className="flex items-center justify-center w-full py-3 rounded-xl bg-gnYellow text-luxuryBlack font-black text-xs uppercase tracking-widest hover:bg-gnYellow/90 transition-colors">
                      Modifier l'annonce
                    </Link>
                  )}
                  <p className="text-center text-gray-600 text-xs py-1">{isOwner ? 'Votre annonce' : 'Vous êtes co-hôte'}</p>
                </div>
              ) : bookingSuccess ? (
                <div className="text-center py-4">
                  <CalendarDaysIcon className="h-12 w-12 text-gnGreen mx-auto mb-3" />
                  <p className="text-gnGreen font-black text-sm uppercase tracking-widest">Demande envoyée !</p>
                  <p className="text-gray-500 text-xs mt-2">Le propriétaire va examiner votre dossier et vous contacter.</p>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4">
                  {bookingError && <p className="text-gnRed text-xs font-bold bg-gnRed/10 border border-gnRed/20 rounded-xl px-3 py-2">{bookingError}</p>}

                  {/* Date d'entrée */}
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Date d'entrée souhaitée</label>
                    <input
                      type="date"
                      value={startDate}
                      min={house.available_from || new Date().toISOString().split('T')[0]}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/8 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-gnYellow/30"
                    />
                    {house.available_from && (
                      <p className="text-gray-600 text-xs mt-1">
                        Disponible à partir du {new Date(house.available_from).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>

                  {/* Durée */}
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">
                      Durée du bail
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="number"
                        min={1}
                        value={durationMonths}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v >= 1) setDurationMonths(v);
                        }}
                        className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-gnYellow"
                      />
                      <span className="text-sm text-gray-400">mois</span>
                    </div>
                    <input
                      type="range"
                      min={1} max={120} step={1}
                      value={Math.min(durationMonths, 120)}
                      onChange={e => setDurationMonths(parseInt(e.target.value))}
                      className="w-full accent-gnYellow"
                    />
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                      <span>1 mois</span>
                      <span>10 ans +</span>
                    </div>
                    {startDate && estimatedEndDate && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        {new Date(startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} → {estimatedEndDate}
                      </p>
                    )}
                  </div>

                  {/* Récapitulatif financier */}
                  <div className="bg-white/5 rounded-xl p-3 text-sm space-y-1.5">
                    <div className="flex justify-between text-gray-400">
                      <span>{Number(pricePerMonth).toLocaleString()} GNF × {durationMonths} mois</span>
                      <span>{total.toLocaleString()} GNF</span>
                    </div>
                    {house.caution_amount > 0 && (
                      <div className="flex justify-between text-gray-500 text-xs">
                        <span>Caution (à part)</span>
                        <span>{Number(house.caution_amount).toLocaleString()} GNF</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-white pt-2 border-t border-white/10">
                      <span>Total loyer</span>
                      <span className="text-gnYellow">{total.toLocaleString()} GNF</span>
                    </div>
                    <p className="text-[10px] text-gray-600 pt-1">Paiement direct au propriétaire (virement / espèces)</p>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-1.5">Message / Présentation</label>
                    <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Présentez-vous, votre situation, pourquoi ce logement…"
                      className="w-full px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-white text-xs placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-gnYellow/30 resize-none" />
                  </div>

                  <div className="flex items-start gap-2 text-xs text-gray-500 border-t border-white/5 pt-3">
                    <span className="text-gnYellow font-black flex-shrink-0">!</span>
                    <span>Votre compte doit être <span className="text-gray-300 font-bold">vérifié</span> pour envoyer une demande. <a href="/profile" className="text-gnYellow underline">Vérifier mon compte</a></span>
                  </div>

                  <button type="submit" disabled={bookingLoading} className="btn-primary w-full">
                    {!user ? 'Se connecter pour candidater' : bookingLoading ? 'Envoi...' : 'Envoyer ma candidature'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
