import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import { ChevronLeftIcon, PaperAirplaneIcon, HomeModernIcon } from '@heroicons/react/24/outline';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function Conversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchMessages();
    // Polling toutes les 4 secondes
    pollRef.current = setInterval(fetchMessages, 4000);
    return () => clearInterval(pollRef.current);
  }, [id, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`/api/messages/conversations/${id}`);
      setConv(data.conversation);
      setMessages(data.messages);
    } catch {
      navigate('/messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const optimistic = {
      id: Date.now(),
      sender_id: user.id,
      content: input.trim(),
      created_at: new Date().toISOString(),
      sender_name: user.name,
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    try {
      const { data } = await axios.post(`/api/messages/conversations/${id}`, { content: optimistic.content });
      setMessages(prev => prev.map(m => m._optimistic ? data : m));
    } catch {
      setMessages(prev => prev.filter(m => !m._optimistic));
      setInput(optimistic.content);
    }
    setSending(false);
  };

  if (!user) return null;

  if (loading) return (
    <div className="bg-luxuryBlack min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gnYellow" />
    </div>
  );

  const otherName = conv ? (user.id === conv.owner_id ? conv.renter_name : conv.owner_name) : '';
  const imgs = conv?.house_images
    ? (Array.isArray(conv.house_images) ? conv.house_images : JSON.parse(conv.house_images || '[]'))
    : [];

  // Regrouper les messages par date
  const grouped = messages.reduce((acc, m) => {
    const day = new Date(m.created_at).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(m);
    return acc;
  }, {});

  return (
    <div className="bg-luxuryBlack min-h-screen flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-luxuryDark border-b border-white/5 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/messages')} className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-blue-900 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            {otherName?.[0]?.toUpperCase() || '?'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{otherName}</p>
            {conv?.house_title && (
              <p className="text-gnYellow text-[10px] font-bold uppercase tracking-widest truncate">{conv.house_title}</p>
            )}
          </div>

          {conv?.house_id && imgs[0] && (
            <Link to={`/houses/${conv.house_id}`} className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
              <img src={imgs[0]} alt="" className="w-full h-full object-cover" />
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-36 pb-28 px-4">
        <div className="max-w-2xl mx-auto space-y-1">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <HomeModernIcon className="h-10 w-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">Démarrez la conversation</p>
            </div>
          )}

          {Object.entries(grouped).map(([day, msgs]) => (
            <div key={day}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex-shrink-0">
                  {new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {msgs.map((m, i) => {
                const isMine = m.sender_id === user.id;
                const prevIsMine = i > 0 && msgs[i - 1].sender_id === user.id;
                const showTime = i === msgs.length - 1 || msgs[i + 1]?.sender_id !== m.sender_id;

                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${prevIsMine === isMine ? 'mt-0.5' : 'mt-3'}`}>
                    <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? 'bg-gnYellow text-luxuryBlack font-medium rounded-br-sm'
                          : 'bg-luxuryDark border border-white/8 text-gray-200 rounded-bl-sm'
                      } ${m._optimistic ? 'opacity-70' : ''}`}>
                        {m.content}
                      </div>
                      {showTime && (
                        <span className="text-[10px] text-gray-700 mt-1 px-1">{formatTime(m.created_at)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-luxuryBlack border-t border-white/5 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              placeholder="Écrire un message..."
              rows={1}
              className="flex-1 bg-luxuryDark border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gnYellow/30 resize-none max-h-32 overflow-y-auto transition-colors"
              style={{ minHeight: '46px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-11 h-11 bg-gnYellow text-luxuryBlack rounded-2xl flex items-center justify-center flex-shrink-0 hover:bg-gnYellow/90 disabled:opacity-40 transition-all"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
