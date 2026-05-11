import { useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isBefore, isAfter,
  isSameDay, format, addMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

function MonthGrid({ viewDate, bookedRanges, availableFrom }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const availFrom = availableFrom ? new Date(availableFrom + 'T00:00:00') : null;
  const calStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getStatus = (date) => {
    if (availFrom && isBefore(date, availFrom)) return 'blocked';
    for (const r of bookedRanges) {
      const s = new Date(r.start_date + 'T00:00:00');
      const e = new Date(r.end_date + 'T00:00:00');
      if (!isBefore(date, s) && !isAfter(date, e))
        return r.type === 'blocked' ? 'blocked' : 'booked';
    }
    return 'available';
  };

  const monthLabel = format(viewDate, 'MMMM yyyy', { locale: fr });

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-white text-center mb-5 uppercase tracking-widest">
        {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
      </p>
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-600 font-black uppercase tracking-tighter py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map(day => {
          const other = !isSameMonth(day, viewDate);
          const past = isBefore(day, today);
          const status = (!other && !past) ? getStatus(day) : null;
          const isToday = !other && isSameDay(day, today);
          if (other) return <div key={day.toISOString()} className="h-9" />;
          let cls = 'h-9 flex flex-col items-center justify-center text-xs rounded-lg border transition-all ';
          if (past) cls += 'text-gray-700 border-transparent';
          else if (status === 'booked') cls += 'bg-red-500/10 text-red-400 border-red-500/20 line-through';
          else if (status === 'blocked') cls += 'bg-orange-400/10 text-orange-400 border-orange-400/20 line-through';
          else cls += `text-white border-white/5 ${isToday ? 'ring-1 ring-gnYellow/60 border-gnYellow/40' : 'hover:border-white/15'}`;
          return (
            <div key={day.toISOString()} className={cls}>
              <span>{format(day, 'd')}</span>
              {!past && (
                <div className={`w-1 h-1 rounded-full mt-0.5 ${
                  status === 'booked' ? 'bg-red-400' :
                  status === 'blocked' ? 'bg-orange-400' : 'bg-gnGreen'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AvailabilityCalendar({ bookedRanges = [], availableFrom }) {
  const [startMonth, setStartMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const today = new Date(); today.setDate(1); today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Disponibilité</h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setStartMonth(m => addMonths(m, -1))}
            disabled={isSameDay(startMonth, today) || isBefore(startMonth, today)}
            className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-20 transition-colors">
            <ChevronLeftIcon className="h-4 w-4 text-white" />
          </button>
          <button type="button" onClick={() => setStartMonth(m => addMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronRightIcon className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <MonthGrid viewDate={startMonth} bookedRanges={bookedRanges} availableFrom={availableFrom} />
        <div className="hidden md:block w-px bg-white/5 self-stretch" />
        <MonthGrid viewDate={addMonths(startMonth, 1)} bookedRanges={bookedRanges} availableFrom={availableFrom} />
      </div>

      <div className="flex items-center gap-5 mt-6 pt-5 border-t border-white/5 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gnGreen" />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Libre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Réservé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Bloqué</span>
        </div>
      </div>
    </div>
  );
}
