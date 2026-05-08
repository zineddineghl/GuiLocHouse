import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import {
  HomeModernIcon, EyeIcon, EyeSlashIcon, TrashIcon, PlusIcon,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get('/api/houses/my')
      .then(r => setListings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
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

  return (
    <div className="min-h-screen bg-luxuryBlack pt-16 pb-20">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-black text-white tracking-tighter">Mes annonces</h1>
            <p className="text-gray-500 text-sm mt-1">{listings.length} annonce{listings.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/post-house" className="flex items-center gap-2 px-5 py-2.5 bg-gnYellow text-luxuryBlack text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gnYellow/90 transition-all">
            <PlusIcon className="h-4 w-4" />
            Publier
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
          </div>
        )}

        {/* Empty */}
        {!loading && listings.length === 0 && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 p-16 text-center">
            <HomeModernIcon className="h-14 w-14 text-gray-700 mx-auto mb-5" />
            <p className="text-white font-black text-lg mb-2">Aucune annonce</p>
            <p className="text-gray-500 text-sm">Publiez votre première annonce et commencez à recevoir des locataires.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(h => {
              const imgs = Array.isArray(h.images) ? h.images : (typeof h.images === 'string' ? JSON.parse(h.images || '[]') : []);
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
                        {Number(h.price_per_night).toLocaleString('fr-FR')} GNF/nuit
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

                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                      <Link
                        to={`/houses/${h.id}`}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Voir
                      </Link>
                      <button
                        onClick={() => handleToggle(h.id, h.available)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-lg hover:border-gnYellow/30 hover:text-gnYellow text-gray-400 transition-colors"
                      >
                        {h.available ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                        {h.available ? 'Masquer' : 'Activer'}
                      </button>
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="ml-auto p-1.5 text-gray-600 hover:text-gnRed hover:bg-gnRed/10 rounded-lg transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
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
