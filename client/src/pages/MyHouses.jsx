import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import {
  HomeModernIcon, EyeIcon, EyeSlashIcon, TrashIcon, PlusIcon,
  ChartBarIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const TYPE_LABELS = {
  apartment: 'Appartement', house: 'Maison', villa: 'Villa',
  studio: 'Studio', room: 'Chambre',
};
const TYPE_ICONS = {
  apartment: '🏢', house: '🏠', villa: '🏡', studio: '🛋️', room: '🛏️',
};

export default function MyHouses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({});   // { [house_id]: { views_count, total_bookings, confirmed_bookings, conversion_rate } }
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('listings'); // 'listings' | 'stats'

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.allSettled([
      axios.get('/api/houses/my'),
      axios.get('/api/houses/my/stats'),
    ]).then(([r1, r2]) => {
      if (r1.status === 'fulfilled') setListings(r1.value.data);
      if (r2.status === 'fulfilled') {
        const map = {};
        r2.value.data.forEach(s => { map[s.id] = s; });
        setStats(map);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const handleToggle = async (id, available) => {
    try {
      await axios.patch(`/api/houses/${id}/toggle`);
      setListings(prev => prev.map(h => h.id === id ? { ...h, available: available ? 0 : 1 } : h));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    try {
      await axios.delete(`/api/houses/${id}`);
      setListings(prev => prev.filter(h => h.id !== id));
    } catch { /* ignore */ }
  };

  // Totaux pour le header stats
  const totalViews     = Object.values(stats).reduce((a, s) => a + Number(s.views_count || 0), 0);
  const totalBookings  = Object.values(stats).reduce((a, s) => a + Number(s.confirmed_bookings || 0), 0);
  const globalConv     = totalViews > 0 ? ((totalBookings / totalViews) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-luxuryBlack pt-16 pb-20">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-black text-white tracking-tighter">Mes annonces</h1>
            <p className="text-gray-500 text-sm mt-1">{listings.length} annonce{listings.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/post-house" className="flex items-center gap-2 px-5 py-2.5 bg-gnYellow text-luxuryBlack text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gnYellow/90 transition-all">
            <PlusIcon className="h-4 w-4" />
            Publier
          </Link>
        </div>

        {/* Tabs */}
        {!loading && listings.length > 0 && (
          <div className="flex gap-1 bg-luxuryDark border border-white/5 rounded-2xl p-1 mb-6">
            <button onClick={() => setTab('listings')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'listings' ? 'bg-gnYellow text-luxuryBlack' : 'text-gray-500 hover:text-gray-300'}`}>
              <HomeModernIcon className="h-3.5 w-3.5" />
              Annonces
            </button>
            <button onClick={() => setTab('stats')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'stats' ? 'bg-gnYellow text-luxuryBlack' : 'text-gray-500 hover:text-gray-300'}`}>
              <ChartBarIcon className="h-3.5 w-3.5" />
              Statistiques
            </button>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 p-16 text-center">
            <HomeModernIcon className="h-14 w-14 text-gray-700 mx-auto mb-5" />
            <p className="text-white font-black text-lg mb-2">Aucune annonce</p>
            <p className="text-gray-500 text-sm">Publiez votre première annonce et commencez à recevoir des locataires.</p>
          </div>
        )}

        {/* ══ TAB ANNONCES ══ */}
        {!loading && tab === 'listings' && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(h => {
              const imgs = Array.isArray(h.images) ? h.images : (typeof h.images === 'string' ? JSON.parse(h.images || '[]') : []);
              const s = stats[h.id] || {};
              return (
                <div key={h.id} className="bg-luxuryDark rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all shadow-lg flex flex-col">
                  {/* Image */}
                  <div className="h-40 bg-black relative overflow-hidden">
                    {imgs[0]
                      ? <img src={imgs[0]} alt={h.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">{TYPE_ICONS[h.type] || '🏠'}</div>
                    }
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      <span className="text-[10px] font-black text-gnYellow uppercase tracking-widest">
                        {Number(h.price_per_month || 0).toLocaleString('fr-FR')} GNF/mois
                      </span>
                    </div>
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${h.available ? 'bg-gnGreen/80 text-white' : 'bg-black/60 text-gray-400 border border-white/10'}`}>
                      {h.available ? 'Visible' : 'Masquée'}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <p className="font-black text-sm text-white truncate">{h.title}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                      {TYPE_LABELS[h.type] || h.type} · {h.city}
                    </p>

                    {/* Mini stats */}
                    <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                      <div className="bg-black/30 rounded-xl py-1.5">
                        <p className="text-white font-black text-sm">{Number(s.views_count || 0).toLocaleString()}</p>
                        <p className="text-[9px] text-gray-600 uppercase tracking-wide font-bold">Vues</p>
                      </div>
                      <div className="bg-black/30 rounded-xl py-1.5">
                        <p className="text-gnYellow font-black text-sm">{s.total_bookings || 0}</p>
                        <p className="text-[9px] text-gray-600 uppercase tracking-wide font-bold">Demandes</p>
                      </div>
                      <div className="bg-black/30 rounded-xl py-1.5">
                        <p className="text-gnGreen font-black text-sm">{s.conversion_rate || '0.0'}%</p>
                        <p className="text-[9px] text-gray-600 uppercase tracking-wide font-bold">Convers.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                      <Link to={`/houses/${h.id}`}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors">
                        Voir
                      </Link>
                      <Link to={`/houses/${h.id}/edit`}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gnYellow border border-white/10 hover:border-gnYellow/30 px-3 py-1.5 rounded-lg transition-colors">
                        Modifier
                      </Link>
                      <button onClick={() => handleToggle(h.id, h.available)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-lg hover:border-gnYellow/30 hover:text-gnYellow text-gray-400 transition-colors">
                        {h.available ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                        {h.available ? 'Masquer' : 'Activer'}
                      </button>
                      <button onClick={() => handleDelete(h.id)}
                        className="ml-auto p-1.5 text-gray-600 hover:text-gnRed hover:bg-gnRed/10 rounded-lg transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ TAB STATISTIQUES ══ */}
        {!loading && tab === 'stats' && listings.length > 0 && (
          <div className="space-y-5">

            {/* Totaux globaux */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-luxuryDark border border-white/8 rounded-2xl px-5 py-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Vues totales</p>
                <p className="text-2xl font-black text-white">{totalViews.toLocaleString('fr-FR')}</p>
              </div>
              <div className="bg-luxuryDark border border-white/8 rounded-2xl px-5 py-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Locations confirmées</p>
                <p className="text-2xl font-black text-gnGreen">{totalBookings}</p>
              </div>
              <div className="bg-luxuryDark border border-white/8 rounded-2xl px-5 py-4 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Taux conversion</p>
                <p className="text-2xl font-black text-gnYellow">{globalConv}%</p>
              </div>
            </div>

            {/* Tableau par annonce */}
            <div className="bg-luxuryDark border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-gnYellow" />
                <h3 className="text-white font-black text-sm uppercase tracking-widest">Par annonce</h3>
              </div>
              <div className="divide-y divide-white/5">
                {listings.map(h => {
                  const s = stats[h.id] || {};
                  const views = Number(s.views_count || 0);
                  const confirmed = Number(s.confirmed_bookings || 0);
                  const pending = Number(s.pending_bookings || 0);
                  const conv = s.conversion_rate || '0.0';
                  const maxViews = Math.max(...listings.map(x => Number(stats[x.id]?.views_count || 0)), 1);
                  const barWidth = Math.round((views / maxViews) * 100);
                  return (
                    <div key={h.id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <Link to={`/houses/${h.id}`} className="font-black text-white text-sm hover:text-gnYellow transition-colors truncate block">
                            {h.title}
                          </Link>
                          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mt-0.5">{h.city}</p>
                        </div>
                        <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border flex-shrink-0 ${h.available ? 'bg-gnGreen/10 text-gnGreen border-gnGreen/20' : 'bg-white/5 text-gray-600 border-white/10'}`}>
                          {h.available ? 'Visible' : 'Masquée'}
                        </div>
                      </div>

                      {/* Barre de vues */}
                      <div className="mb-3">
                        <div className="flex justify-between text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">
                          <span>Vues</span>
                          <span>{views.toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gnYellow/60 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                        </div>
                      </div>

                      {/* Métriques */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                          <p className="text-white font-black text-base">{views.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-600 uppercase tracking-wide font-bold">Vues</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gnYellow font-black text-base">{s.total_bookings || 0}</p>
                          <p className="text-[9px] text-gray-600 uppercase tracking-wide font-bold">Demandes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gnGreen font-black text-base">{confirmed}</p>
                          <p className="text-[9px] text-gray-600 uppercase tracking-wide font-bold">Confirmées</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gnYellow font-black text-base">{conv}%</p>
                          <p className="text-[9px] text-gray-600 uppercase tracking-wide font-bold">Convers.</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
