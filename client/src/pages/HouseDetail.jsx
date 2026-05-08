import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import { HomeModernIcon, UsersIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    axios.get('/api/houses/' + id)
      .then(r => setHouse(r.data))
      .catch(() => navigate('/houses'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-luxuryBlack flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
    </div>
  );
  if (!house) return null;

  const images = Array.isArray(house.images) ? house.images : JSON.parse(house.images || '[]');
  const isOwner = user?.id === house.owner_id;
  const nights = startDate && endDate ? Math.max(0, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000)) : 0;
  const total = nights * house.price_per_night;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setBookingError('');
    setBookingLoading(true);
    try {
      await axios.post('/api/bookings', { house_id: house.id, start_date: startDate, end_date: endDate, guests, message });
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
                  <img src={images[imgIdx]} alt={house.title} className="w-full h-full object-cover" />
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
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <HomeModernIcon className="h-24 w-24 text-white/10" />
                </div>
              )}
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-[10px] font-black text-gnYellow uppercase tracking-widest">{TYPE_LABELS[house.type] || house.type}</span>
                  <h1 className="text-2xl font-black text-white mt-1">{house.title}</h1>
                  <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-1">
                    <MapPinIcon className="h-4 w-4" />
                    {house.neighborhood ? house.neighborhood + ', ' : ''}{house.city}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-gnYellow font-black text-2xl">{Number(house.price_per_night).toLocaleString()}</span>
                  <span className="text-gray-500 text-xs font-bold block">GNF / nuit</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 py-4 border-y border-white/5">
                <span className="flex items-center gap-2 text-sm text-gray-400"><HomeModernIcon className="h-4 w-4 text-gnYellow" />{house.bedrooms} chambre{house.bedrooms > 1 ? 's' : ''}</span>
                <span className="flex items-center gap-2 text-sm text-gray-400"><HomeModernIcon className="h-4 w-4 text-gnYellow" />{house.bathrooms} salle{house.bathrooms > 1 ? 's' : ''} de bain</span>
                <span className="flex items-center gap-2 text-sm text-gray-400"><UsersIcon className="h-4 w-4 text-gnYellow" />{house.max_guests} personnes max</span>
              </div>
              {house.description && (
                <div className="mt-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Description</h3>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{house.description}</p>
                </div>
              )}
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Proprietaire</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gnYellow/10 border border-gnYellow/20 flex items-center justify-center">
                  <span className="text-gnYellow font-black text-lg">{house.owner_name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{house.owner_name}</p>
                  {house.owner_phone && (
                    <a href={'tel:' + house.owner_phone} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gnYellow mt-1">
                      <PhoneIcon className="h-3.5 w-3.5" />{house.owner_phone}
                    </a>
                  )}
                </div>
                {!isOwner && user && (
                  <ContactButton houseId={house.id} navigate={navigate} />
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 sticky top-24">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-gnYellow font-black text-2xl">{Number(house.price_per_night).toLocaleString()}</span>
                <span className="text-gray-500 text-sm font-bold">GNF / nuit</span>
              </div>
              {isOwner ? (
                <p className="text-center text-gray-500 text-sm font-bold py-4">Votre annonce</p>
              ) : bookingSuccess ? (
                <div className="text-center py-4">
                  <CalendarDaysIcon className="h-12 w-12 text-gnGreen mx-auto mb-3" />
                  <p className="text-gnGreen font-black text-sm uppercase tracking-widest">Demande envoyee !</p>
                  <p className="text-gray-500 text-xs mt-2">Le proprietaire va vous contacter.</p>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4">
                  {bookingError && <p className="text-gnRed text-xs font-bold bg-gnRed/10 border border-gnRed/20 rounded-xl px-3 py-2">{bookingError}</p>}
                  <div className="form-group">
                    <label className="form-label">Arrivee</label>
                    <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-field-sm" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Depart</label>
                    <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || new Date().toISOString().split('T')[0]} className="input-field-sm" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Voyageurs</label>
                    <input type="number" min={1} max={house.max_guests} value={guests} onChange={e => setGuests(parseInt(e.target.value))} className="input-field-sm" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message (optionnel)</label>
                    <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Presentez-vous..." className="input-field-sm resize-none" />
                  </div>
                  {nights > 0 && (
                    <div className="bg-white/5 rounded-xl p-3 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>{Number(house.price_per_night).toLocaleString()} x {nights} nuit{nights > 1 ? 's' : ''}</span>
                        <span>{total.toLocaleString()} GNF</span>
                      </div>
                      <div className="flex justify-between font-black text-white mt-2 pt-2 border-t border-white/10">
                        <span>Total</span>
                        <span className="text-gnYellow">{total.toLocaleString()} GNF</span>
                      </div>
                    </div>
                  )}
                  <button type="submit" disabled={bookingLoading} className="btn-primary w-full">
                    {!user ? 'Se connecter pour reserver' : bookingLoading ? 'Envoi...' : 'Envoyer la demande'}
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
