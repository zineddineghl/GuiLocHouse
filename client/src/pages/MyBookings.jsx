import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import {
  CalendarDaysIcon, UserIcon, HomeModernIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon, XMarkIcon,
  DocumentArrowDownIcon, SparklesIcon, BuildingOfficeIcon,
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
                          {b.renter_phone && <p className="text-gray-500 text-xs">{b.renter_phone}</p>}
                          {b.renter_email && <p className="text-gray-600 text-xs">{b.renter_email}</p>}
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
