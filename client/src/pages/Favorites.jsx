import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import { HomeModernIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';

const TYPE_LABELS = {
  apartment: 'Appartement', house: 'Maison', villa: 'Villa',
  studio: 'Studio', room: 'Chambre',
};

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get('/api/favorites')
      .then(r => setHouses(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (houseId) => {
    try {
      await axios.post(`/api/favorites/${houseId}`);
      setHouses(prev => prev.filter(h => h.id !== houseId));
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-luxuryBlack pt-16 pb-20">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <HeartIcon className="h-7 w-7 text-gnRed" />
          <div>
            <h1 className="text-3xl font-display font-black text-white tracking-tighter">Favoris</h1>
            <p className="text-gray-500 text-sm mt-0.5">{houses.length} annonce{houses.length !== 1 ? 's' : ''} sauvegardée{houses.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
          </div>
        )}

        {!loading && houses.length === 0 && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 p-16 text-center">
            <HeartIcon className="h-14 w-14 text-gray-700 mx-auto mb-5" />
            <p className="text-white font-black text-lg mb-2">Aucun favori</p>
            <p className="text-gray-500 text-sm mb-8">Cliquez sur le cœur d'une annonce pour la sauvegarder ici.</p>
            <Link to="/houses" className="inline-flex items-center gap-2 px-8 py-3 bg-gnYellow text-luxuryBlack font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gnYellow/90 transition-all">
              Parcourir les annonces
            </Link>
          </div>
        )}

        {!loading && houses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {houses.map(h => {
              const imgs = Array.isArray(h.images) ? h.images : JSON.parse(h.images || '[]');
              const thumb = imgs[0] || null;
              return (
                <div key={h.id} className="card group relative">
                  {/* Heart remove button */}
                  <button
                    onClick={() => handleRemove(h.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-white/10 hover:scale-110 transition-transform"
                  >
                    <HeartIcon className="h-4 w-4 text-gnRed" />
                  </button>

                  <Link to={`/houses/${h.id}`} className="block">
                    <div className="relative h-48 bg-white/5 overflow-hidden rounded-t-2xl">
                      {thumb ? (
                        <img src={thumb} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HomeModernIcon className="h-14 w-14 text-white/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10">
                        {TYPE_LABELS[h.type] || h.type}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="font-black text-white text-base truncate mb-1">{h.title}</h3>
                      <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3 text-gnYellow/60 flex-shrink-0" />
                        {h.neighborhood ? `${h.neighborhood}, ` : ''}{h.city}
                      </p>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-gnYellow font-black text-lg">{Number(h.price_per_night).toLocaleString()}</span>
                          <span className="text-gray-500 text-xs font-bold"> GNF / nuit</span>
                        </div>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider border border-white/10 rounded-lg px-2.5 py-1 group-hover:border-gnYellow/30 group-hover:text-gnYellow/60 transition-colors">
                          Voir
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
