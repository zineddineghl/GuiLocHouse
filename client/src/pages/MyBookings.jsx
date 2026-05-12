import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import {
  CalendarDaysIcon, UserIcon, HomeModernIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon, XMarkIcon,
  DocumentArrowDownIcon, SparklesIcon, BuildingOfficeIcon, PhoneIcon,
} from '@heroicons/react/24/outline';

const STATUS = {
  pending:   { label: 'En attente',  color: 'bg-gnYellow/15 text-gnYellow border-gnYellow/20' },
  confirmed: { label: 'Confirmée',   color: 'bg-gnGreen/15 text-gnGreen border-gnGreen/20' },
  rejected:  { label: 'Refusée',     color: 'bg-gnRed/15 text-gnRed border-gnRed/20' },
  cancelled: { label: 'Annulée',     color: 'bg-white/5 text-gray-500 border-white/10' },
};

const STATUS_FILTERS = [
  { key: 'all',       label: 'Tout' },
  { key: 'pending',   label: 'En attente' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'rejected',  label: 'Refusées' },
  { key: 'cancelled', label: 'Annulées' },
];

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function StatCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-luxuryBlack border border-white/8 rounded-2xl px-5 py-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('tenant');
  const [mine, setMine] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenantFilter, setTenantFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        axios.get('/api/bookings/my'),
        axios.get('/api/bookings/received'),
      ]);
      setMine(r1.data);
      setReceived(r2.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const updateStatus = async (id, status, isMine) => {
    try {
      const { data } = await axios.put(`/api/bookings/${id}/status`, { status });
      if (isMine) {
        setMine(prev => prev.map(b => b.id === id ? { ...b, status: data.status } : b));
      } else {
        setReceived(prev => prev.map(b => b.id === id ? { ...b, status: data.status } : b));
      }
    } catch { /* ignore */ }
  };

  const downloadContract = (bookingId) => window.open(`/api/bookings/${bookingId}/contract`, '_blank');

  if (!user) return null;

  // ── Stats locataire
  const tenantStats = {
    total:     mine.length,
    pending:   mine.filter(b => b.status === 'pending').length,
    confirmed: mine.filter(b => b.status === 'confirmed').length,
    rejected:  mine.filter(b => b.status === 'rejected').length,
  };

  // ── Stats propriétaire
  const ownerStats = {
    total:     received.length,
    pending:   received.filter(b => b.status === 'pending').length,
    confirmed: received.filter(b => b.status === 'confirmed').length,
    rejected:  received.filter(b => b.status === 'rejected').length,
  };

  // ── Prochaine entrée confirmée
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nextEntry = mine
    .filter(b => b.status === 'confirmed' && new Date(b.start_date) >= today)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))[0] || null;

  // ── Filtrage
  const filteredMine     = tenantFilter === 'all' ? mine     : mine.filter(b => b.status === tenantFilter);
  const filteredReceived = ownerFilter  === 'all' ? received : received.filter(b => b.status === ownerFilter);

  const TABS = [
    { id: 'tenant', label: 'Locataire',    count: mine.length,     icon: UserIcon },
    { id: 'owner',  label: 'Propriétaire', count: received.length, icon: BuildingOfficeIcon },
  ];

  return (
    <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

        <div>
          <h1 className="text-3xl font-display font-black text-white tracking-tighter">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">Vos candidatures et demandes reçues</p>
        </div>

        {/* Role tabs */}
        <div className="flex gap-1 bg-luxuryDark border border-white/5 rounded-2xl p-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  tab === t.id ? 'bg-gnYellow text-luxuryBlack' : 'text-gray-500 hover:text-gray-300'
                }`}>
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {t.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${tab === t.id ? 'bg-luxuryBlack/20 text-luxuryBlack' : 'bg-white/10 text-gray-400'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB LOCATAIRE
        ══════════════════════════════════════════════════════════ */}
        {!loading && tab === 'tenant' && (
          <div className="space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total"      value={tenantStats.total} />
              <StatCard label="En attente" value={tenantStats.pending}   color="text-gnYellow" />
              <StatCard label="Confirmées" value={tenantStats.confirmed} color="text-gnGreen" />
              <StatCard label="Refusées"   value={tenantStats.rejected}  color="text-gnRed" />
            </div>

            {/* Prochaine entrée */}
            {nextEntry && (() => {
              const days = daysUntil(nextEntry.start_date);
              return (
                <div className="bg-gnYellow/8 border border-gnYellow/20 rounded-2xl px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gnYellow/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="h-5 w-5 text-gnYellow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gnYellow font-black text-sm">
                      {days === 0 ? "Vous emménagez aujourd'hui !" : days === 1 ? "Vous emménagez demain !" : `Vous emménagez dans ${days} jour${days > 1 ? 's' : ''}`}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{nextEntry.house_title} — {fmt(nextEntry.start_date)}</p>
                  </div>
                  <Link to={`/houses/${nextEntry.house_id}`}
                    className="text-[10px] font-black uppercase tracking-widest text-gnYellow border border-gnYellow/30 px-3 py-1.5 rounded-xl hover:bg-gnYellow/10 transition-colors flex-shrink-0">
                    Voir
                  </Link>
                </div>
              );
            })()}

            {/* Filtres statut */}
            {mine.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setTenantFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                      tenantFilter === f.key
                        ? 'bg-gnYellow text-luxuryBlack border-gnYellow'
                        : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/25'
                    }`}>
                    {f.label}
                    {f.key !== 'all' && mine.filter(b => b.status === f.key).length > 0 && (
                      <span className="ml-1 opacity-70">({mine.filter(b => b.status === f.key).length})</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Liste */}
            {mine.length === 0 && (
              <div className="bg-luxuryDark rounded-3xl border border-white/5 p-16 text-center">
                <CalendarDaysIcon className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Vous n'avez pas encore de candidature</p>
                <Link to="/houses" className="inline-block mt-4 px-6 py-2.5 bg-gnYellow text-luxuryBlack font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gnYellow/90 transition-all">
                  Explorer les logements
                </Link>
              </div>
            )}

            {filteredMine.length === 0 && mine.length > 0 && (
              <div className="bg-luxuryDark rounded-3xl border border-white/5 p-10 text-center">
                <p className="text-gray-600 text-sm">Aucune candidature avec ce statut</p>
              </div>
            )}

            {filteredMine.map(b => {
              const imgs = Array.isArray(b.images) ? b.images : (typeof b.images === 'string' ? JSON.parse(b.images || '[]') : []);
              const months = b.duration_months || 1;
              const st = STATUS[b.status] || STATUS.pending;
              return (
                <div key={b.id} className="bg-luxuryDark rounded-3xl border border-white/5 shadow-xl overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-44 h-36 sm:h-auto flex-shrink-0 bg-black/60">
                      {imgs[0]
                        ? <img src={imgs[0]} alt={b.house_title} className="w-full h-full object-cover opacity-80" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏠</div>
                      }
                    </div>
                    <div className="flex-1 p-5 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <Link to={`/houses/${b.house_id}`} className="font-black text-white text-base hover:text-gnYellow transition-colors truncate block">
                            {b.house_title}
                          </Link>
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                            <HomeModernIcon className="h-3.5 w-3.5" /> {b.city}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border flex-shrink-0 ${st.color}`}>
                          {st.label}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-600" />
                          <span>{fmt(b.start_date)} → {fmt(b.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="h-3.5 w-3.5 text-gray-600" />
                          <span>{months} mois</span>
                        </div>
                        {b.guests && (
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-3.5 w-3.5 text-gray-600" />
                            <span>{b.guests} personne{b.guests > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>

                      {b.status === 'confirmed' && b.owner_phone && (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-gnGreen/8 border border-gnGreen/20 rounded-2xl">
                          <div className="w-8 h-8 rounded-xl bg-gnGreen/15 flex items-center justify-center flex-shrink-0">
                            <PhoneIcon className="h-4 w-4 text-gnGreen" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-gnGreen font-bold uppercase tracking-widest">Propriétaire</p>
                            <p className="text-white text-sm font-bold">{b.owner_name}</p>
                            <p className="text-gray-400 text-xs">{b.owner_phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <a href={`tel:${b.owner_phone}`} className="flex items-center gap-1 px-3 py-1.5 bg-gnGreen/15 border border-gnGreen/30 rounded-xl text-gnGreen text-xs font-bold hover:bg-gnGreen/25 transition-colors">
                              <PhoneIcon className="h-3 w-3" /> Appeler
                            </a>
                            <a href={`https://wa.me/${b.owner_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl text-[#25D366] text-xs font-bold hover:bg-[#25D366]/20 transition-colors">
                              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                        <span className="text-gnYellow font-black text-lg">
                          {Number(b.total_price).toLocaleString('fr-FR')} GNF
                          <span className="text-gray-600 font-normal text-xs ml-1">total bail</span>
                        </span>
                        <div className="flex gap-2 flex-wrap">
                          {b.status === 'confirmed' && (
                            <button onClick={() => downloadContract(b.id)}
                              className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gnYellow border border-gnYellow/30 bg-gnYellow/5 hover:bg-gnYellow/10 rounded-xl transition-colors">
                              <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                              Contrat PDF
                            </button>
                          )}
                          {(b.status === 'pending' || b.status === 'confirmed') && (
                            <button onClick={() => updateStatus(b.id, 'cancelled', true)}
                              className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gnRed border border-gnRed/30 bg-gnRed/5 hover:bg-gnRed/10 rounded-xl transition-colors">
                              <XMarkIcon className="h-3.5 w-3.5" />
                              Annuler
                            </button>
                          )}
                        </div>
                      </div>

                      {b.message && (
                        <p className="mt-3 text-xs text-gray-500 italic bg-black/30 px-3 py-2 rounded-xl border border-white/5">
                          "{b.message}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB PROPRIÉTAIRE
        ══════════════════════════════════════════════════════════ */}
        {!loading && tab === 'owner' && (
          <div className="space-y-5">

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total"      value={ownerStats.total} />
              <StatCard label="En attente" value={ownerStats.pending}   color="text-gnYellow" />
              <StatCard label="Confirmées" value={ownerStats.confirmed} color="text-gnGreen" />
              <StatCard label="Refusées"   value={ownerStats.rejected}  color="text-gnRed" />
            </div>

            {/* Alerte candidatures en attente */}
            {ownerStats.pending > 0 && (
              <div className="bg-gnYellow/8 border border-gnYellow/20 rounded-2xl px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gnYellow/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="h-5 w-5 text-gnYellow" />
                </div>
                <p className="text-gnYellow font-black text-sm flex-1">
                  {ownerStats.pending} candidature{ownerStats.pending > 1 ? 's' : ''} en attente de votre réponse
                </p>
                <button onClick={() => setOwnerFilter('pending')}
                  className="text-[10px] font-black uppercase tracking-widest text-gnYellow border border-gnYellow/30 px-3 py-1.5 rounded-xl hover:bg-gnYellow/10 transition-colors flex-shrink-0">
                  Voir
                </button>
              </div>
            )}

            {/* Filtres statut */}
            {received.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map(f => (
                  <button key={f.key} onClick={() => setOwnerFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                      ownerFilter === f.key
                        ? 'bg-gnYellow text-luxuryBlack border-gnYellow'
                        : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/25'
                    }`}>
                    {f.label}
                    {f.key !== 'all' && received.filter(b => b.status === f.key).length > 0 && (
                      <span className="ml-1 opacity-70">({received.filter(b => b.status === f.key).length})</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Liste */}
            {received.length === 0 && (
              <div className="bg-luxuryDark rounded-3xl border border-white/5 p-16 text-center">
                <HomeModernIcon className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Aucune candidature reçue pour le moment</p>
              </div>
            )}

            {filteredReceived.length === 0 && received.length > 0 && (
              <div className="bg-luxuryDark rounded-3xl border border-white/5 p-10 text-center">
                <p className="text-gray-600 text-sm">Aucune candidature avec ce statut</p>
              </div>
            )}

            {filteredReceived.map(b => {
              const months = b.duration_months || 1;
              const st = STATUS[b.status] || STATUS.pending;
              return (
                <div key={b.id} className="bg-luxuryDark rounded-3xl border border-white/5 shadow-xl p-6">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <Link to={`/houses/${b.house_id}`} className="font-black text-white text-base hover:text-gnYellow transition-colors">
                        {b.house_title}
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs font-black">
                          {b.renter_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">{b.renter_name}</p>
                          {b.status === 'confirmed' && b.renter_phone && (
                            <div className="flex items-center gap-2 mt-1">
                              <a href={`tel:${b.renter_phone}`} className="flex items-center gap-1 text-gnGreen text-xs font-bold hover:underline">
                                <PhoneIcon className="h-3 w-3" />{b.renter_phone}
                              </a>
                              <a href={`https://wa.me/${b.renter_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 text-[#25D366] text-xs font-bold hover:underline">
                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                WhatsApp
                              </a>
                            </div>
                          )}
                          {b.renter_email && <p className="text-gray-600 text-xs mt-0.5">{b.renter_email}</p>}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border flex-shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1.5">
                      <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-600" />
                      <span>{fmt(b.start_date)} → {fmt(b.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="h-3.5 w-3.5 text-gray-600" />
                      <span>{months} mois</span>
                    </div>
                    {b.guests && (
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 text-gray-600" />
                        <span>{b.guests} personne{b.guests > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {b.message && (
                    <p className="text-xs text-gray-500 italic bg-black/30 px-3 py-2 rounded-xl border border-white/5 mb-4">
                      "{b.message}"
                    </p>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-white/5">
                    <span className="text-gnYellow font-black text-lg">
                      {Number(b.total_price).toLocaleString('fr-FR')} GNF
                      <span className="text-gray-600 font-normal text-xs ml-1">total bail</span>
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {b.status === 'confirmed' && (
                        <button onClick={() => downloadContract(b.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gnYellow border border-gnYellow/30 bg-gnYellow/5 hover:bg-gnYellow/10 rounded-xl transition-colors">
                          <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                          Contrat PDF
                        </button>
                      )}
                      {b.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(b.id, 'confirmed', false)}
                            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-gnGreen hover:bg-gnGreen/80 rounded-xl transition-colors">
                            <CheckCircleIcon className="h-4 w-4" />
                            Accepter
                          </button>
                          <button onClick={() => updateStatus(b.id, 'rejected', false)}
                            className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gnRed border border-gnRed/30 bg-gnRed/5 hover:bg-gnRed/10 rounded-xl transition-colors">
                            <XCircleIcon className="h-4 w-4" />
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
