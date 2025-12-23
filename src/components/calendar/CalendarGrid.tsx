'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Sun, Moon, Coffee, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarDay {
  date: string;
  cycle_day: number;
  work_type: 'work_day' | 'work_night' | 'off' | null;
  is_leave: boolean;
  commitments: {
    id: string;
    type: string;
    name: string;
    hours?: number;
  }[];
  is_preview?: boolean;
}

interface CalendarGridProps {
  days: CalendarDay[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  view?: 'month' | 'year';
}

const workTypeConfig = {
  work_day: { 
    bg: 'bg-work-day', 
    border: 'border-work-day/30',
    icon: Sun,
    label: 'Day Shift'
  },
  work_night: { 
    bg: 'bg-work-night', 
    border: 'border-work-night/30',
    icon: Moon,
    label: 'Night Shift'
  },
  off: { 
    bg: 'bg-work-off', 
    border: 'border-work-off/30',
    icon: Coffee,
    label: 'Off Day'
  },
};

export function CalendarGrid({ 
  days, 
  selectedDate, 
  onSelectDate, 
  onMonthChange,
  view: _view = 'month'  // Reserved for future view switching
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    days.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [days]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' 
      ? subMonths(currentMonth, 1) 
      : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-watchman-surface rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-white/5">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-xs font-medium text-watchman-muted uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const calendarDay = daysMap.get(dateStr);
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);

          const workConfig = calendarDay?.work_type 
            ? workTypeConfig[calendarDay.work_type] 
            : null;

          const hasCommitments = calendarDay?.commitments && calendarDay.commitments.length > 0;
          const isLeave = calendarDay?.is_leave;
          const isPreview = calendarDay?.is_preview;

          return (
            <motion.button
              key={dateStr}
              onClick={() => onSelectDate(day)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative aspect-square p-1 border-r border-b border-white/5 transition-colors',
                'hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-watchman-accent focus:ring-inset',
                !inCurrentMonth && 'opacity-30',
                isSelected && 'ring-2 ring-watchman-accent ring-inset',
                isPreview && 'bg-watchman-accent/5'
              )}
            >
              <div className="h-full flex flex-col">
                {/* Date Number */}
                <div className="flex items-center justify-between px-1">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      today && 'text-watchman-accent',
                      !inCurrentMonth && 'text-watchman-muted'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {calendarDay?.cycle_day && (
                    <span className="text-[10px] text-watchman-muted">
                      D{calendarDay.cycle_day}
                    </span>
                  )}
                </div>

                {/* Work Type Indicator */}
                <div className="flex-1 flex flex-col justify-center items-center gap-1 py-1">
                  {workConfig && (
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center',
                        workConfig.bg,
                        isPreview && 'opacity-50 border-2 border-dashed border-white/30'
                      )}
                    >
                      <workConfig.icon className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {isLeave && (
                    <div className="w-6 h-6 rounded-full bg-watchman-mint flex items-center justify-center">
                      <Plane className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {hasCommitments && (
                    <div className="flex gap-0.5">
                      {calendarDay.commitments.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-watchman-accent"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Today Indicator */}
                {today && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-watchman-accent" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-6 py-4 border-t border-white/5 text-xs text-watchman-muted">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-work-day" />
          <span>Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-work-night" />
          <span>Night</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-work-off" />
          <span>Off</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-watchman-mint" />
          <span>Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-watchman-accent" />
            <div className="w-1.5 h-1.5 rounded-full bg-watchman-accent" />
          </div>
          <span>Commitments</span>
        </div>
      </div>
    </div>
  );
}

// Year Overview Component
interface YearOverviewProps {
  days: CalendarDay[];
  year: number;
  onSelectMonth: (month: Date) => void;
}

export function YearOverview({ days, year, onSelectMonth }: YearOverviewProps) {
  const daysMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    days.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [days]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(year, i, 1);
      const monthEnd = endOfMonth(monthStart);
      const daysInMonth: { date: Date; day: CalendarDay | undefined }[] = [];

      let day = monthStart;
      while (day <= monthEnd) {
        const dateStr = format(day, 'yyyy-MM-dd');
        daysInMonth.push({ date: day, day: daysMap.get(dateStr) });
        day = addDays(day, 1);
      }

      return { month: monthStart, days: daysInMonth };
    });
  }, [year, daysMap]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {months.map(({ month, days }) => (
        <motion.button
          key={format(month, 'yyyy-MM')}
          onClick={() => onSelectMonth(month)}
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-watchman-surface rounded-xl border border-white/5 hover:border-watchman-accent/20 transition-colors text-left"
        >
          <h3 className="text-sm font-semibold mb-3">
            {format(month, 'MMMM')}
          </h3>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map(({ date, day }) => {
              const workType = day?.work_type;
              return (
                <div
                  key={format(date, 'yyyy-MM-dd')}
                  className={cn(
                    'w-2 h-2 rounded-sm',
                    workType === 'work_day' && 'bg-work-day',
                    workType === 'work_night' && 'bg-work-night',
                    workType === 'off' && 'bg-work-off',
                    day?.is_leave && 'bg-watchman-mint',
                    !workType && !day?.is_leave && 'bg-white/10'
                  )}
                />
              );
            })}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
