const CATEGORIES = [
  { key: 'cleanliness',   label: 'Propreté' },
  { key: 'accuracy',      label: 'Précision' },
  { key: 'communication', label: 'Communication' },
  { key: 'location',      label: 'Emplacement' },
  { key: 'checkin',       label: 'Arrivée' },
  { key: 'value',         label: 'Rapport qualité-prix' },
];

export default function RatingBars({ averages }) {
  if (!averages) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3.5">
      {CATEGORIES.map(({ key, label }) => {
        const val = parseFloat(averages[key] || 0);
        const pct = (val / 5) * 100;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm text-gray-300 w-36 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
              <div
                className="h-1.5 rounded-full bg-gnYellow transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-black text-white w-7 text-right shrink-0">
              {val.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
