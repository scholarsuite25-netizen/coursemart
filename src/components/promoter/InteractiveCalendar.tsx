import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  Lock,
  Sparkles,
  CheckCircle2,
  MapPin,
  Clock,
} from 'lucide-react';
import type { CalendarEngagement } from '../../types/promoter';

export interface InteractiveCalendarProps {
  engagements: CalendarEngagement[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onBookedDateSelected?: (engagement: CalendarEngagement) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function InteractiveCalendar({
  engagements,
  selectedDate,
  onSelectDate,
  onBookedDateSelected,
}: InteractiveCalendarProps) {
  // Determine initial month/year based on selectedDate or default to November 2026
  const initialDate = useMemo(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m] = selectedDate.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const today = new Date();
    // Prefer 2026 showcase context if current year is earlier, else current
    const defaultYear = today.getFullYear() >= 2026 ? today.getFullYear() : 2026;
    const defaultMonth = today.getFullYear() >= 2026 ? today.getMonth() : 10; // November
    return { year: defaultYear, month: defaultMonth };
  }, [selectedDate]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.year);
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.month);
  const [activeAlert, setActiveAlert] = useState<{
    date: string;
    engagement?: CalendarEngagement;
    message: string;
  } | null>(null);

  // Today's ISO date string
  const todayIso = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Engagements lookup map for fast checking
  const engagementsMap = useMemo(() => {
    const map = new Map<string, CalendarEngagement>();
    for (const eng of engagements) {
      if (eng.type === 'booked') {
        map.set(eng.date, eng);
      }
    }
    return map;
  }, [engagements]);

  // Navigate months
  const handlePrevMonth = () => {
    setActiveAlert(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setActiveAlert(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build grid calendar cells
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      dateIso: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      status: 'available' | 'booked' | 'past' | 'selected';
      engagement?: CalendarEngagement;
    }> = [];

    // Leading padding cells from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateIso = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateIso,
        dayNumber: dayNum,
        isCurrentMonth: false,
        status: 'past',
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const dateIso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const bookedEngagement = engagementsMap.get(dateIso);

      let status: 'available' | 'booked' | 'past' | 'selected' = 'available';

      if (bookedEngagement) {
        status = 'booked';
      } else if (dateIso < todayIso) {
        status = 'past';
      }

      if (dateIso === selectedDate && status === 'available') {
        status = 'selected';
      }

      cells.push({
        dateIso,
        dayNumber: day,
        isCurrentMonth: true,
        status,
        engagement: bookedEngagement,
      });
    }

    // Trailing padding cells to make complete rows of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateIso = `${nextY}-${String(nextM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dateIso,
        dayNumber: day,
        isCurrentMonth: false,
        status: 'past',
      });
    }

    return cells;
  }, [currentYear, currentMonth, engagementsMap, todayIso, selectedDate]);

  // Handle cell click
  const handleCellClick = (cell: (typeof calendarCells)[0]) => {
    if (!cell.isCurrentMonth) return;

    if (cell.status === 'past') {
      setActiveAlert({
        date: cell.dateIso,
        message: 'Past dates cannot be selected for new bookings.',
      });
      return;
    }

    if (cell.status === 'booked' && cell.engagement) {
      setActiveAlert({
        date: cell.dateIso,
        engagement: cell.engagement,
        message: `Date is committed for: "${cell.engagement.title}". Please select an available date marked in green.`,
      });
      if (onBookedDateSelected) {
        onBookedDateSelected(cell.engagement);
      }
      return;
    }

    // Date is available
    setActiveAlert(null);
    onSelectDate(cell.dateIso);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Click any open date in green to initiate your facilitator invitation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              setCurrentYear(d.getFullYear() >= 2026 ? d.getFullYear() : 2026);
              setCurrentMonth(d.getFullYear() >= 2026 ? d.getMonth() : 10);
              setActiveAlert(null);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Today / Default
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Alert banner if booked or past date was clicked */}
      {activeAlert && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-sm animate-fade-in">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{activeAlert.message}</p>
            {activeAlert.engagement && (
              <div className="mt-2 text-xs space-y-1 text-amber-800 dark:text-amber-300/90 bg-amber-100/60 dark:bg-amber-900/40 p-2.5 rounded-lg">
                {activeAlert.engagement.organization && (
                  <p className="flex items-center gap-1.5">
                    <span className="font-semibold">Host Organization:</span>{' '}
                    {activeAlert.engagement.organization}
                  </p>
                )}
                {activeAlert.engagement.timeSlot && (
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 inline" /> {activeAlert.engagement.timeSlot}
                  </p>
                )}
                {activeAlert.engagement.locationType && (
                  <p className="flex items-center gap-1.5 capitalize">
                    <MapPin className="w-3.5 h-3.5 inline" />{' '}
                    Format: {activeAlert.engagement.locationType}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            className="text-amber-600 dark:text-amber-400 hover:opacity-75 text-xs font-semibold px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Calendar Weekday Headers */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
        {WEEKDAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarCells.map((cell, idx) => {
          const isSelected = cell.dateIso === selectedDate;
          const isBooked = cell.status === 'booked';
          const isPast = cell.status === 'past';
          const isAvailable = cell.isCurrentMonth && !isBooked && !isPast;

          let cellClasses =
            'relative flex flex-col items-center justify-between min-h-[64px] sm:min-h-[82px] p-1.5 sm:p-2 rounded-xl transition-all text-left ';

          if (!cell.isCurrentMonth) {
            cellClasses +=
              'bg-slate-50/50 dark:bg-slate-900/30 text-slate-300 dark:text-slate-700 opacity-40 cursor-not-allowed border border-transparent';
          } else if (isSelected) {
            cellClasses +=
              'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500 dark:ring-emerald-400 cursor-pointer font-bold transform scale-[1.02] border border-emerald-500';
          } else if (isBooked) {
            cellClasses +=
              'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer';
          } else if (isPast) {
            cellClasses +=
              'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800/50 cursor-not-allowed';
          } else {
            // Available
            cellClasses +=
              'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 cursor-pointer';
          }

          return (
            <button
              type="button"
              key={`${cell.dateIso}-${idx}`}
              onClick={() => handleCellClick(cell)}
              className={cellClasses}
              disabled={!cell.isCurrentMonth}
              title={
                isBooked
                  ? `Committed: ${cell.engagement?.title || 'Booked Slot'}`
                  : isAvailable
                  ? `Available for Booking: ${cell.dateIso}`
                  : cell.dateIso
              }
            >
              <div className="w-full flex items-center justify-between">
                <span
                  className={`text-xs sm:text-sm font-semibold ${
                    isSelected ? 'text-white' : ''
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {isBooked && (
                  <span className="p-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
                    <Lock className="w-3 h-3" />
                  </span>
                )}

                {isSelected && (
                  <span className="p-0.5 rounded-full bg-white/20 text-white">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                )}

                {isAvailable && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </div>

              {/* Status Badge inside cell */}
              <div className="w-full mt-1">
                {isBooked && (
                  <span className="inline-block w-full text-center text-[10px] leading-tight font-medium px-1 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 truncate">
                    Booked
                  </span>
                )}
                {isSelected && (
                  <span className="inline-block w-full text-center text-[10px] leading-tight font-semibold px-1 py-0.5 rounded bg-white/20 text-white truncate">
                    Selected
                  </span>
                )}
                {isAvailable && !isSelected && (
                  <span className="hidden sm:inline-block w-full text-center text-[10px] leading-tight font-medium px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 truncate">
                    Available
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend & Availability Summary */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Available Date (Open for bookings)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-rose-500" />
            </span>
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Booked / Committed Date
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">
              ✓
            </span>
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Your Selected Date
            </span>
          </div>
        </div>

        {selectedDate && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <Sparkles className="w-4 h-4" />
            <span>Active Selection: {selectedDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
