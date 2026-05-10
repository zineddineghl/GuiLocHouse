import { useState, useEffect } from 'react';
import axios from 'axios';
import { StarIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../App';
import RatingBars from './RatingBars';
import ReviewCard from './ReviewCard';
import ReviewsModal from './ReviewsModal';

// ── Star picker (interactive) ──────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 focus:outline-none"
        >
          <StarIcon
            className={`h-6 w-6 transition-colors ${
              (hover || value) >= i ? 'text-gnYellow' : 'text-zinc-700'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const CATEGORIES = [
  { key: 'cleanliness',   label: 'Propreté' },
  { key: 'accuracy',      label: 'Précision' },
  { key: 'communication', label: 'Communication' },
  { key: 'location',      label: 'Emplacement' },
  { key: 'checkin',       label: 'Arrivée' },
  { key: 'value',         label: 'Rapport qualité-prix' },
];

// ── Add review form ────────────────────────────────────────────────────────────
function AddReviewForm({ houseId, ownerId, onAdded }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [overall, setOverall] = useState(0);
  const [cats, setCats] = useState({
    cleanliness: 0, accuracy: 0, communication: 0,
    location: 0, checkin: 0, value: 0,
  });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Don't show form to non-logged-in users or the owner
  if (!user || user.id === ownerId) return null;

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 flex items-center gap-3">
        <StarIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
        <p className="text-green-400 font-semibold text-sm">Merci ! Votre avis a été publié.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!overall) return setError('Veuillez donner une note globale.');
    if (!comment.trim()) return setError('Veuillez écrire un commentaire.');
    setLoading(true);
    setError('');
    try {
      await axios.post(`/api/reviews/house/${houseId}`, {
        comment,
        rating_overall: overall,
        rating_cleanliness:   cats.cleanliness   || overall,
        rating_accuracy:      cats.accuracy      || overall,
        rating_communication: cats.communication || overall,
        rating_location:      cats.location      || overall,
        rating_checkin:       cats.checkin       || overall,
        rating_value:         cats.value         || overall,
      });
      setSuccess(true);
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-zinc-800 pt-8">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-6 py-3 bg-gnYellow text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-gnYellow/90 transition-colors shadow-lg shadow-gnYellow/20"
        >
          Laisser un avis
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <h3 className="font-black text-white text-base">Votre avis</h3>

          {/* Global rating */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
              Note globale <span className="text-gnYellow">*</span>
            </label>
            <StarPicker value={overall} onChange={setOverall} />
          </div>

          {/* Category ratings */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {CATEGORIES.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
                <StarPicker
                  value={cats[key]}
                  onChange={v => setCats(c => ({ ...c, [key]: v }))}
                />
              </div>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
              Commentaire <span className="text-gnYellow">*</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="Partagez votre expérience avec ce logement..."
              className="w-full bg-black/40 border border-zinc-700 rounded-xl p-4 text-white text-sm focus:border-gnYellow/40 outline-none resize-none placeholder-gray-600 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-semibold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setOpen(false); setError(''); }}
              className="flex-1 py-3 border border-zinc-700 text-gray-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gnYellow text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gnYellow/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Main ReviewsSection ────────────────────────────────────────────────────────
export default function ReviewsSection({ houseId, ownerId }) {
  const [reviews, setReviews] = useState([]);
  const [averages, setAverages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchReviews = () => {
    setLoading(true);
    axios.get(`/api/reviews/house/${houseId}`)
      .then(({ data }) => {
        setReviews(data.reviews);
        setAverages(data.averages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, [houseId]);

  if (loading) {
    return <div className="h-24 bg-zinc-900/50 animate-pulse rounded-2xl" />;
  }

  const preview = reviews.slice(0, 6);

  return (
    <div className="space-y-8">
      {reviews.length > 0 ? (
        <>
          {/* ── Global header ── */}
          <div className="flex items-center gap-2.5">
            <StarIcon className="h-7 w-7 text-gnYellow" />
            <span className="text-2xl font-black text-white">
              {parseFloat(averages?.overall || 0).toFixed(2)}
            </span>
            <span className="text-gray-500 font-semibold">
              · {reviews.length} avis
            </span>
          </div>

          {/* ── Category bars ── */}
          <RatingBars averages={averages} />

          <hr className="border-zinc-800" />

          {/* ── Reviews preview grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preview.map(r => (
              <ReviewCard
                key={r.id}
                review={r}
                onExpand={() => setModalOpen(true)}
              />
            ))}
          </div>

          {/* ── "Show all" button ── */}
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 border border-white text-white font-bold rounded-xl hover:bg-white hover:text-black transition-colors text-xs uppercase tracking-widest"
          >
            Afficher les {reviews.length} avis
          </button>
        </>
      ) : (
        /* Empty state */
        <div className="text-center py-10 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <StarIcon className="h-10 w-10 text-gnYellow mx-auto mb-3 opacity-30" />
          <p className="text-gray-400 font-semibold text-sm">Aucun avis pour le moment</p>
          <p className="text-gray-600 text-xs mt-1">Soyez le premier à donner votre avis !</p>
        </div>
      )}

      {/* ── Add review form ── */}
      <AddReviewForm houseId={houseId} ownerId={ownerId} onAdded={fetchReviews} />

      {/* ── Modal ── */}
      {modalOpen && (
        <ReviewsModal
          reviews={reviews}
          averages={averages}
          total={reviews.length}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
