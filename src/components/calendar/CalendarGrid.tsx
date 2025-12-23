'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { ChevronLeft, ChevronRight, Sun, Moon, Coffee, Plane, Sparkles } from 'lucide-react';
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

const workTypeConfig: Record<string, {
  bg: string;
  gradient: string;
  glow: string;
  border: string;
  icon: typeof Sun;
  label: string;
  textColor: string;
}> = {
  work_day: { 
    bg: 'bg-amber-500', 
    gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
    glow: 'shadow-amber-500/30',
    border: 'border-amber-500/30',
    icon: Sun,
    label: 'Day Shift',
    textColor: 'text-amber-400'
  },
  work_night: { 
    bg: 'bg-indigo-500', 
    gradient: 'from-indigo-500/20 via-indigo-500/10 to-transparent',
    glow: 'shadow-indigo-500/30',
    border: 'border-indigo-500/30',
    icon: Moon,
    label: 'Night Shift',
    textColor: 'text-indigo-400'
  },
  off: { 
    bg: 'bg-emerald-500', 
    gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    glow: 'shadow-emerald-500/30',
    border: 'border-emerald-500/30',
    icon: Coffee,
    label: 'Off Day',
    textColor: 'text-emerald-400'
  },
};

export function CalendarGrid({ 
  days, 
  selectedDate, 
  onSelectDate, 
  onMonthChange,
  view: _view = 'month'
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

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

  const navigateMonth = useCallback((dir: 'prev' | 'next') => {
    setDirection(dir === 'prev' ? -1 : 1);
    const newMonth = dir === 'prev' 
      ? subMonths(currentMonth, 1) 
      : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  }, [currentMonth, onMonthChange]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="glass rounded-3xl overflow-hidden border border-white/10">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <motion.button
          onClick={() => navigateMonth('prev')}
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-xl glass hover:bg-white/10 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:text-watchman-accent transition-colors" />
        </motion.button>
        
        <AnimatePresence mode="wait" custom={direction}>
          <motion.h2
            key={format(currentMonth, 'yyyy-MM')}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="text-xl font-semibold tracking-tight"
          >
            {format(currentMonth, 'MMMM yyyy')}
          </motion.h2>
        </AnimatePresence>
        
        <motion.button
          onClick={() => navigateMonth('next')}
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-xl glass hover:bg-white/10 transition-colors group"
        >
          <ChevronRight className="w-5 h-5 group-hover:text-watchman-accent transition-colors" />
        </motion.button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              'px-2 py-4 text-center text-xs font-semibold uppercase tracking-wider',
              i >= 5 ? 'text-watchman-muted/60' : 'text-watchman-muted'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid with Animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={format(currentMonth, 'yyyy-MM')}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="grid grid-cols-7"
        >
          {calendarDays.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const calendarDay = daysMap.get(dateStr);
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);
            const isHovered = hoveredDate === dateStr;

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
                onMouseEnter={() => setHoveredDate(dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01, duration: 0.2 }}
                whileHover={{ scale: 1.02, zIndex: 10 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative aspect-square p-1.5 border-r border-b border-white/5 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-watchman-accent/50 focus:ring-inset',
                  !inCurrentMonth && 'opacity-25',
                  isSelected && 'ring-2 ring-watchman-accent ring-inset bg-watchman-accent/10',
                  isPreview && 'bg-watchman-accent/5 border-dashed border-watchman-accent/30',
                  isHovered && inCurrentMonth && !isSelected && 'bg-white/5',
                  workConfig && inCurrentMonth && `bg-gradient-to-br ${workConfig.gradient}`
                )}
              >
                <div className="h-full flex flex-col relative">
                  {/* Date Number */}
                  <div className="flex items-center justify-between px-1">
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors',
                        today && 'text-watchman-accent font-bold',
                        !inCurrentMonth && 'text-watchman-muted/50',
                        isSelected && 'text-watchman-accent'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {calendarDay?.cycle_day && calendarDay?.work_type && inCurrentMonth && (
                      <span className="text-[9px] font-medium text-watchman-muted/70 bg-white/5 px-1.5 py-0.5 rounded">
                        {calendarDay.work_type === 'off' 
                          ? 'OFF' 
                          : calendarDay.work_type === 'work_night' 
                            ? `N${((calendarDay.cycle_day - 1) % 5) + 1}`
                            : `D${((calendarDay.cycle_day - 1) % 5) + 1}`
                        }
                      </span>
                    )}
                  </div>

                  {/* Work Type Indicator */}
                  <div className="flex-1 flex flex-col justify-center items-center gap-1.5 py-1">
                    {workConfig && inCurrentMonth && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center shadow-lg',
                          workConfig.bg,
                          workConfig.glow,
                          isPreview && 'opacity-60 ring-2 ring-dashed ring-white/30'
                        )}
                      >
                        <workConfig.icon className="w-4 h-4 text-white" />
                      </motion.div>
                    )}

                    {isLeave && inCurrentMonth && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30"
                      >
                        <Plane className="w-4 h-4 text-white" />
                      </motion.div>
                    )}

                    {hasCommitments && inCurrentMonth && (
                      <div className="flex gap-1">
                        {calendarDay.commitments.slice(0, 3).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="w-1.5 h-1.5 rounded-full bg-watchman-accent shadow-sm shadow-watchman-accent/50"
                          />
                        ))}
                        {calendarDay.commitments.length > 3 && (
                          <span className="text-[8px] text-watchman-accent ml-0.5">
                            +{calendarDay.commitments.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Today Indicator */}
                  {today && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex items-center gap-1"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-watchman-accent animate-pulse" />
                    </motion.div>
                  )}

                  {/* Hover Preview Tooltip */}
                  <AnimatePresence>
                    {isHovered && calendarDay && inCurrentMonth && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none"
                      >
                        <div className="glass-strong px-3 py-2 rounded-xl shadow-xl border border-white/10 whitespace-nowrap">
                          <p className="text-xs font-medium">
                            {workConfig?.label || 'No schedule'}
                          </p>
                          {hasCommitments && (
                            <p className="text-[10px] text-watchman-muted">
                              {calendarDay.commitments.length} commitment{calendarDay.commitments.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-watchman-surface rotate-45 border-r border-b border-white/10" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 border-t border-white/5 text-xs bg-white/[0.02]">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-5 h-5 rounded-lg bg-amber-500 shadow-md shadow-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sun className="w-3 h-3 text-white" />
          </div>
          <span className="text-watchman-muted group-hover:text-white transition-colors">Day Shift</span>
        </div>
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-5 h-5 rounded-lg bg-indigo-500 shadow-md shadow-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Moon className="w-3 h-3 text-white" />
          </div>
          <span className="text-watchman-muted group-hover:text-white transition-colors">Night Shift</span>
        </div>
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-5 h-5 rounded-lg bg-emerald-500 shadow-md shadow-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Coffee className="w-3 h-3 text-white" />
          </div>
          <span className="text-watchman-muted group-hover:text-white transition-colors">Off</span>
        </div>
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 shadow-md shadow-teal-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plane className="w-3 h-3 text-white" />
          </div>
          <span className="text-watchman-muted group-hover:text-white transition-colors">Leave</span>
        </div>
        <div className="flex items-center gap-2 group cursor-default">
          <div className="flex gap-0.5">
            <div className="w-2 h-2 rounded-full bg-watchman-accent shadow-sm shadow-watchman-accent/50" />
            <div className="w-2 h-2 rounded-full bg-watchman-accent shadow-sm shadow-watchman-accent/50" />
          </div>
          <span className="text-watchman-muted group-hover:text-white transition-colors">Commitments</span>
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
      {months.map(({ month, days }, index) => (
        <motion.button
          key={format(month, 'yyyy-MM')}
          onClick={() => onSelectMonth(month)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="p-5 glass rounded-2xl border border-white/5 hover:border-watchman-accent/30 transition-all duration-300 text-left group"
        >
          <h3 className="text-sm font-semibold mb-4 group-hover:text-watchman-accent transition-colors">
            {format(month, 'MMMM')}
          </h3>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map(({ date, day }) => {
              const workType = day?.work_type;
              return (
                <div
                  key={format(date, 'yyyy-MM-dd')}
                  className={cn(
                    'w-2.5 h-2.5 rounded-sm transition-transform group-hover:scale-110',
                    workType === 'work_day' && 'bg-amber-500 shadow-sm shadow-amber-500/30',
                    workType === 'work_night' && 'bg-indigo-500 shadow-sm shadow-indigo-500/30',
                    workType === 'off' && 'bg-emerald-500 shadow-sm shadow-emerald-500/30',
                    day?.is_leave && 'bg-teal-500 shadow-sm shadow-teal-500/30',
                    !workType && !day?.is_leave && 'bg-white/10'
                  )}
                />
              );
            })}
          </div>
          
          {/* Mini Stats */}
          <div className="flex gap-3 mt-4 text-[10px] text-watchman-muted">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {days.filter(d => d.day?.work_type === 'off').length} off
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
