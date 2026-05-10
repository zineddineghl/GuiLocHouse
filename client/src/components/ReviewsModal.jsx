import { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import RatingBars from './RatingBars';

const AVATAR_COLORS = [
  'bg-gnYellow text-black',
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-purple-500 text-white',
  'bg-orange-500 text-white',
  'bg-pink-500 text-white',
];

function ModalReviewCard({ review }) {
  const initials = (review.user_name || '?')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[(review.user_name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const date = new Date(review.created_at).toLocaleDateString('fr-FR', {
    month: 'long', year: 'numeric',
  });
  const stars = Math.round(parseFloat(review.rating_overall));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${color}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">{review.user_name}</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5">{date}</p>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className={`h-3 w-3 ${i < stars ? 'text-gnYellow' : 'text-zinc-700'}`} />
          ))}
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
    </div>
  );
}

export default function ReviewsModal({ reviews, averages, total, onClose }) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase();
    return (
      r.comment.toLowerCase().includes(q) ||
      r.user_name.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#111] border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-gnYellow" />
            <span className="font-black text-white text-lg">
              {parseFloat(averages?.overall || 0).toFixed(2)}
            </span>
            <span className="text-gray-500 font-semibold">· {total} avis</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* Left panel — rating summary (fixed on desktop) */}
          <div className="lg:w-[320px] shrink-0 p-6 border-b border-zinc-800 lg:border-b-0 lg:border-r lg:overflow-y-auto">
            <h3 className="font-black text-white text-base uppercase tracking-widest mb-5">Notes</h3>
            <RatingBars averages={averages} />
          </div>

          {/* Right panel — searchable reviews */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search bar */}
            <div className="px-6 pt-5 pb-4 flex-shrink-0">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder='Rechercher dans les avis (ex: "calme", "propre")'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-gnYellow/40 outline-none transition-colors placeholder-gray-600"
                />
              </div>
              {search && (
                <p className="text-xs text-gray-500 mt-2 font-semibold">
                  {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour &ldquo;{search}&rdquo;
                </p>
              )}
            </div>

            {/* Reviews list */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <MagnifyingGlassIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold text-sm">Aucun avis ne correspond à votre recherche</p>
                </div>
              ) : (
                filtered.map(r => <ModalReviewCard key={r.id} review={r} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
