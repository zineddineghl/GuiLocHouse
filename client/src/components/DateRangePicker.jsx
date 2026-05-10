import { useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isBefore, isAfter,
  isSameDay, format, addMonths, subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

export default function DateRangePicker({ startDate, endDate, onChange, bookedRanges = [] }) {
  const [viewDate, setViewDate] = useState(() => startDate ? new Date(startDate + 'T00:00:00') : new Date());
  const [hoverDate, setHoverDate] = useState(null);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const startVal = startDate ? new Date(startDate + 'T00:00:00') : null;
  const endVal = endDate ? new Date(endDate + 'T00:00:00') : null;

  const calStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const isBooked = (date) => bookedRanges.some(r => {
    const s = new Date(r.start_date + 'T00:00:00');
    const e = new Date(r.end_date + 'T00:00:00');
    return !isBefore(date, s) && !isAfter(date, e);
  });

  const isPast = (date) => isBefore(date, today);
  const isDisabled = (date) => isPast(date) || isBooked(date);

  const isInRange = (date) => {
    if (!startVal) return false;
    const rangeEnd = endVal || hoverDate;
    if (!rangeEnd) return false;
    const [from, to] = isAfter(startVal, rangeEnd) ? [rangeEnd, startVal] : [startVal, rangeEnd];
    return isAfter(date, from) && isBefore(date, to);
  };

  const hasBookedInRange = (from, to) =>
    eachDayOfInterval({ start: from, end: to }).some(d => isBooked(d));

  const handleDayClick = (day) => {
    if (isDisabled(day)) return;
    if (!startVal || endVal) {
      onChange({ start_date: format(day, 'yyyy-MM-dd'), end_date: '' });
    } else if (isBefore(day, startVal) || isSameDay(day, startVal)) {
      onChange({ start_date: format(day, 'yyyy-MM-dd'), end_date: '' });
    } else if (hasBookedInRange(startVal, day)) {
      onChange({ start_date: format(day, 'yyyy-MM-dd'), end_date: '' });
    } else {
      onChange({ start_date: startDate, end_date: format(day, 'yyyy-MM-dd') });
    }
  };

  const monthLabel = format(viewDate, 'MMMM yyyy', { locale: fr });

  return (
    <div className="select-none w-full">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))}
          disabled={isSameMonth(viewDate, today)}
          className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-20 transition-colors">
          <ChevronLeftIcon className="h-4 w-4 text-gray-400" />
        </button>
        <span className="text-sm font-bold text-white">
          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
        </span>
        <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-600 font-black uppercase tracking-tighter py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map(day => {
          const other = !isSameMonth(day, viewDate);
          const booked = !other && isBooked(day);
          const past = !other && isPast(day);
          const isStart = !other && startVal && isSameDay(day, startVal);
          const isEnd = !other && endVal && isSameDay(day, endVal);
          const inRange = !other && isInRange(day);
          const isToday = !other && isSameDay(day, today);

          let cls = 'h-9 flex items-center justify-center text-xs transition-all cursor-pointer ';
          if (other) cls += 'invisible ';
          else if (booked) cls += 'bg-red-500/10 text-red-400 line-through cursor-not-allowed rounded-lg ';
          else if (past) cls += 'text-gray-700 cursor-not-allowed ';
          else if (isStart || isEnd) cls += 'bg-gnYellow text-black font-black rounded-full ';
          else if (inRange) cls += 'bg-gnYellow/15 text-gnYellow ';
          else cls += `rounded-full hover:bg-white/8 ${isToday ? 'font-bold text-gnYellow' : 'text-gray-300'} `;

          return (
            <div key={day.toISOString()} className={cls}
              onClick={() => !other && handleDayClick(day)}
              onMouseEnter={() => !other && !isDisabled(day) && setHoverDate(day)}
              onMouseLeave={() => setHoverDate(null)}>
              {other ? '' : format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}
