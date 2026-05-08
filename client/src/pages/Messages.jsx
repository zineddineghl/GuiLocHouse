import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const AVATAR_COLORS = ['bg-blue-900','bg-purple-900','bg-emerald-900','bg-orange-900','bg-rose-900','bg-teal-900'];

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get('/api/messages/conversations')
      .then(r => setConvs(r.data))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="text-3xl font-display font-black text-white tracking-tighter mb-6">Messages</h1>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
          </div>
        )}

        {!loading && convs.length === 0 && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 p-16 text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Aucun message pour le moment</p>
            <Link to="/houses" className="inline-block mt-4 px-6 py-2.5 bg-gnYellow text-luxuryBlack font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gnYellow/90 transition-all">
              Explorer les logements
            </Link>
          </div>
        )}

        {!loading && convs.length > 0 && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 overflow-hidden divide-y divide-white/5">
            {convs.map(c => {
              const other = user.id === c.owner_id ? c.renter_name : c.owner_name;
              const otherId = user.id === c.owner_id ? c.renter_id : c.owner_id;
              const avatarColor = AVATAR_COLORS[(other?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
              const initials = other?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
              const imgs = c.house_images
                ? (Array.isArray(c.house_images) ? c.house_images : JSON.parse(c.house_images || '[]'))
                : [];

              return (
                <Link key={c.id} to={`/messages/${c.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors group">
                  {/* Avatar */}
                  <div className={`${avatarColor} w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-base relative`}>
                    {initials}
                    {c.unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gnYellow rounded-full flex items-center justify-center text-[9px] font-black text-luxuryBlack">
                        {c.unread}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-bold truncate ${c.unread > 0 ? 'text-white' : 'text-gray-300'}`}>{other}</p>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">{timeAgo(c.last_message_at)}</span>
                    </div>
                    {c.house_title && (
                      <p className="text-[10px] text-gnYellow font-bold uppercase tracking-widest truncate">{c.house_title}</p>
                    )}
                    <p className={`text-xs truncate mt-0.5 ${c.unread > 0 ? 'text-gray-300 font-medium' : 'text-gray-600'}`}>
                      {c.last_message || 'Démarrez la conversation'}
                    </p>
                  </div>

                  {/* House thumbnail */}
                  {imgs[0] && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 opacity-60">
                      <img src={imgs[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
