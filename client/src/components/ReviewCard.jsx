import { StarIcon } from '@heroicons/react/24/solid';

const AVATAR_COLORS = [
  'bg-gnYellow text-black',
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-purple-500 text-white',
  'bg-orange-500 text-white',
  'bg-pink-500 text-white',
];

function Avatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

const PREVIEW_LENGTH = 220;

export default function ReviewCard({ review, onExpand }) {
  const isLong = review.comment.length > PREVIEW_LENGTH;
  const displayText = isLong
    ? review.comment.slice(0, PREVIEW_LENGTH).trimEnd() + '…'
    : review.comment;

  const date = new Date(review.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const stars = Math.round(parseFloat(review.rating_overall));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar name={review.user_name} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-tight">{review.user_name}</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5">{date}</p>
        </div>
        {/* Stars */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              className={`h-3 w-3 ${i < stars ? 'text-gnYellow' : 'text-zinc-700'}`}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      <p className="text-gray-300 text-sm leading-relaxed">
        {displayText}
        {isLong && (
          <button
            onClick={onExpand}
            className="ml-1 font-bold text-white hover:text-gnYellow transition-colors whitespace-nowrap"
          >
            En savoir plus &rsaquo;
          </button>
        )}
      </p>
    </div>
  );
}
