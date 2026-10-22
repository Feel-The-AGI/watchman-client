'use client';

import { useMemo, useState, useCallback, useEffect, useSyncExternalStore } from 'react';
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
import { ChevronLeft, ChevronRight, Sun, Moon, Coffee, Plane, Sparkles, Lock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cycleDayBadge, type BadgeBlock } from '@/lib/cycle-day-badge';
import { calendarCellKind, calendarHoverLabel, dayCommitments } from '@/lib/calendar-day';
import { isFreeMonthLocked, isYearMonthVisible } from '@/lib/free-calendar-access';
import { FREE_HORIZON_MESSAGE, horizonThroughLabel, isDayPastFreeHorizon, isMonthEntirelyPastHorizon, lockedMonthSpanLabel, SEE_FURTHER_AHEAD, yearMonthShiftCounts } from '@/lib/free-horizon';
import { monthMiniCells, WEEKDAY_INITIALS } from '@/lib/year-mini';
import { FreeHorizonNotice } from '@/components/upgrade/FreeHorizonNotice';
import { monthArrowLabel, UPGRADE_AHEAD_LABEL } from '@/lib/calendar-view';
import { LOCKED_MONTH_PAY_LINE, lockedMonthPriceLine } from '@/lib/upgrade-offer';
import { api } from '@/lib/api';
import Link from 'next/link';

function useFinePointer(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const query = window.matchMedia('(hover: hover) and (pointer: fine)');
      query.addEventListener('change', onStoreChange);
      return () => query.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    () => false,
  );
}

function useLockedMonthPrice(userTier: 'free' | 'pro' | 'admin'): string | null {
  const [priceLine, setPriceLine] = useState<string | null>(null);
  useEffect(() => {
    if (userTier !== 'free') return;
    let cancelled = false;
    api.payments.getPricing()
      .then((pricing) => {
        if (!cancelled) setPriceLine(lockedMonthPriceLine(pricing));
      })
      .catch(() => {
        if (!cancelled) setPriceLine(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userTier]);
  return userTier === 'free' ? priceLine : null;
}

function LockedAheadDetails({ priceLine }: { priceLine: string | null }) {
  return (
    <>
      {priceLine && <p className="mt-1 text-[10px] text-white">{priceLine}</p>}
      <p className="mt-1 text-[10px] text-watchman-muted">
        {LOCKED_MONTH_PAY_LINE}
      </p>
    </>
  );
}

export interface DailyLog {
  id: string;
  date: string;
  note: string;
  created_at: string;
  updated_at?: string;
}

export interface Incident {
  id: string;
  date: string;
  type: 'overtime' | 'safety' | 'equipment' | 'harassment' | 'injury' | 'policy_violation' | 'health' | 'discrimination' | 'workload' | 'compensation' | 'scheduling' | 'communication' | 'retaliation' | 'environment' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reported_to?: string;
  witnesses?: string;
  outcome?: string;
  created_at: string;
  updated_at?: string;
}

export interface CalendarDay {
  date: string;
  cycle_day: number;
  work_type: 'work_day' | 'work_night' | 'off' | 'blank' | null;
  is_leave: boolean;
  commitments: {
    id: string;
    type: string;
    name: string;
    hours?: number;
  }[];
  is_preview?: boolean;
  // New fields for daily logs
  logs?: DailyLog[];
  incidents?: Incident[];
  actual_hours_worked?: number;
  overtime_hours?: number;
  block_day?: number;
}

interface CalendarGridProps {
  days: CalendarDay[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  view?: 'month' | 'year';
  initialMonth?: Date;
  userTier?: 'free' | 'pro' | 'admin';
  pattern?: BadgeBlock[] | null;
  freeHorizonEnd?: string | null;
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
  blank: {
    bg: 'bg-zinc-600',
    gradient: 'from-zinc-600/20 via-zinc-600/10 to-transparent',
    glow: 'shadow-zinc-500/20',
    border: 'border-zinc-500/30',
    icon: HelpCircle,
    label: 'Untracked',
    textColor: 'text-zinc-400'
  },
};

export function CalendarGrid({
  days,
  selectedDate,
  onSelectDate,
  onMonthChange,
  view: _view = 'month',
  initialMonth,
  userTier = 'free',
  pattern = null,
  freeHorizonEnd = null,
}: CalendarGridProps) {
  const lockedPriceLine = useLockedMonthPrice(userTier);
  const finePointer = useFinePointer();
  const currentMonth = useMemo(() => {
    const source = initialMonth || new Date();
    return new Date(source.getFullYear(), source.getMonth(), 1);
  }, [initialMonth]);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const today = new Date();

  const isMonthLocked = (month: Date) => isFreeMonthLocked(month, today, userTier);

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

    while (days.length < 42) {
      days.push(addDays(days[days.length - 1], 1));
    }

    return days;
  }, [currentMonth]);

  const navigateMonth = useCallback((dir: 'prev' | 'next') => {
    const newMonth = dir === 'prev'
      ? subMonths(currentMonth, 1)
      : addMonths(currentMonth, 1);

    if (dir === 'next' && isMonthLocked(newMonth)) {
      return;
    }

    onMonthChange?.(newMonth);
  }, [currentMonth, onMonthChange, isMonthLocked]);

  // Check if next month navigation should be disabled
  const isNextMonthLocked = isMonthLocked(addMonths(currentMonth, 1));
  const isCurrentMonthLocked = isMonthLocked(currentMonth);
  const monthPastHorizon = isMonthEntirelyPastHorizon(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    freeHorizonEnd,
  );

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="glass rounded-3xl overflow-hidden border border-white/10">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <motion.button
          type="button"
          aria-label={monthArrowLabel('previous')}
          onClick={() => navigateMonth('prev')}
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-xl glass hover:bg-white/10 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:text-watchman-accent transition-colors" />
        </motion.button>
        
        <h2 className="text-xl font-semibold tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <motion.button
          type="button"
          aria-label={monthArrowLabel('next')}
          onClick={() => navigateMonth('next')}
          whileHover={!isNextMonthLocked ? { scale: 1.1, x: 2 } : {}}
          whileTap={!isNextMonthLocked ? { scale: 0.95 } : {}}
          disabled={isNextMonthLocked}
          className={cn(
            "p-3 rounded-xl glass transition-colors group",
            isNextMonthLocked
              ? "cursor-not-allowed opacity-60"
              : "hover:bg-white/10"
          )}
          title={isNextMonthLocked ? UPGRADE_AHEAD_LABEL : "Next month"}
        >
          {isNextMonthLocked ? (
            <Lock className="w-5 h-5 text-watchman-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 group-hover:text-watchman-accent transition-colors" />
          )}
        </motion.button>
      </div>
      {isNextMonthLocked && (
        <div className="px-6 pb-3 -mt-2 text-center text-xs text-watchman-muted">
          <Link href="/pricing" className="text-watchman-accent hover:underline">
            {UPGRADE_AHEAD_LABEL}
          </Link>
          <LockedAheadDetails priceLine={lockedPriceLine} />
        </div>
      )}

      {monthPastHorizon ? (
        <div className="px-6 py-16 flex justify-center">
          <FreeHorizonNotice />
        </div>
      ) : (
      <div className="relative">
      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              'px-1 sm:px-2 py-2 sm:py-4 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider',
              i >= 5 ? 'text-watchman-muted/60' : 'text-watchman-muted'
            )}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const calendarDay = daysMap.get(dateStr);
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);
            const isHovered = hoveredDate === dateStr;

            const pastHorizon = inCurrentMonth && isDayPastFreeHorizon(dateStr, freeHorizonEnd);
            const workConfig = !pastHorizon && calendarDay?.work_type 
              ? workTypeConfig[calendarDay.work_type] 
              : null;

            const commitments = dayCommitments(calendarDay);
            const hasCommitments = commitments.length > 0;
            const isLeave = calendarCellKind(calendarDay) === 'leave';
            const isPreview = calendarDay?.is_preview;
            const dayBadge = !inCurrentMonth || pastHorizon
              ? null
              : isLeave
                ? 'Leave'
                : cycleDayBadge(calendarDay?.work_type, calendarDay?.cycle_day, {
                    pattern,
                    blockDay: calendarDay?.block_day,
                  });

            const column = index % 7;
            const tipAlign = column <= 1 ? 'left-1' : column >= 5 ? 'right-1' : 'left-1/2 -translate-x-1/2';
            const showTip = finePointer && isHovered && inCurrentMonth && !pastHorizon;

            return (
              <button
                key={dateStr}
                type="button"
                data-date={dateStr}
                data-work-type={pastHorizon ? '' : (calendarDay?.work_type ?? '')}
                data-selected={isSelected ? 'true' : 'false'}
                data-locked={pastHorizon ? 'true' : 'false'}
                onClick={() => onSelectDate(day)}
                aria-label={pastHorizon
                  ? `${format(day, 'MMMM d, yyyy')}, locked. ${SEE_FURTHER_AHEAD}`
                  : `${format(day, 'MMMM d, yyyy')}${calendarDay ? `, ${calendarHoverLabel(calendarDay)}` : ''}`}
                onMouseEnter={() => setHoveredDate(dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
                className={cn(
                  'relative aspect-square p-1.5 border-r border-b border-white/5 transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-watchman-accent/50 focus:ring-inset',
                  !inCurrentMonth && 'opacity-25',
                  pastHorizon && !isSelected && 'opacity-60',
                  isSelected && 'ring-2 ring-watchman-accent ring-inset bg-watchman-accent/15',
                  isPreview && 'bg-watchman-accent/5 border-dashed border-watchman-accent/30',
                  isHovered && inCurrentMonth && !isSelected && 'bg-white/5',
                  isLeave && inCurrentMonth && !pastHorizon && 'bg-gradient-to-br from-teal-500/25 via-teal-500/10 to-transparent',
                  workConfig && inCurrentMonth && !isLeave && `bg-gradient-to-br ${workConfig.gradient}`
                )}
              >
                <div className="h-full flex flex-col relative">
                  {/* Date Number */}
                  <div className="flex items-center justify-between px-0.5 sm:px-1">
                    <span
                      className={cn(
                        'text-[10px] sm:text-sm font-medium transition-colors',
                        today && 'text-watchman-accent font-bold',
                        !inCurrentMonth && 'text-watchman-muted/50',
                        isSelected && 'text-watchman-accent'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayBadge && (
                      <span className="hidden sm:inline text-[9px] font-medium text-watchman-muted/70 bg-white/5 px-1.5 py-0.5 rounded">
                        {dayBadge}
                      </span>
                    )}
                  </div>
                  {pastHorizon && (
                    <div className="flex-1 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-watchman-muted" />
                    </div>
                  )}

                  {/* Work Type Indicator */}
                  <div className="flex-1 flex flex-col justify-center items-center gap-0.5 sm:gap-1.5 py-0.5 sm:py-1">
                    {isLeave && inCurrentMonth && !pastHorizon && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30"
                      >
                        <Plane className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" />
                      </motion.div>
                    )}

                    {workConfig && inCurrentMonth && !isLeave && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={cn(
                          'w-5 h-5 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg',
                          workConfig.bg,
                          workConfig.glow,
                          isPreview && 'opacity-60 ring-2 ring-dashed ring-white/30'
                        )}
                      >
                        <workConfig.icon className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-white" />
                      </motion.div>
                    )}

                    {hasCommitments && inCurrentMonth && (
                      <div className="flex gap-1">
                        {commitments.slice(0, 3).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="w-1.5 h-1.5 rounded-full bg-watchman-accent shadow-sm shadow-watchman-accent/50"
                          />
                        ))}
                        {commitments.length > 3 && (
                          <span className="text-[8px] text-watchman-accent ml-0.5">
                            +{commitments.length - 3}
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
                  {showTip && calendarDay && (
                      <div className={cn('absolute bottom-full mb-2 z-20 pointer-events-none', tipAlign)}>
                        <div className="glass-strong px-3 py-2 rounded-xl shadow-xl border border-white/10 whitespace-nowrap">
                          <p className="text-xs font-medium">
                            {calendarHoverLabel(calendarDay)}
                          </p>
                          {hasCommitments && (
                            <p className="text-[10px] text-watchman-muted">
                              {commitments.length} commitment{commitments.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                  )}
                </div>
              </button>
            );
          })}
      </div>
      {isCurrentMonthLocked && (
        <div className="absolute inset-0 z-20 bg-watchman-bg/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center mb-2 border border-white/10">
            <Sparkles className="w-5 h-5 text-watchman-accent" />
          </div>
          <p className="text-xs font-medium text-white mb-1">Upgrade to Pro</p>
          <Link href="/pricing" className="text-[10px] text-watchman-accent hover:underline">
            {UPGRADE_AHEAD_LABEL}
          </Link>
          <LockedAheadDetails priceLine={lockedPriceLine} />
        </div>
      )}
      </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 sm:gap-x-6 gap-y-2 px-3 sm:px-6 py-3 sm:py-4 border-t border-white/5 text-[10px] sm:text-xs bg-white/[0.02]">
        <div className="flex items-center gap-1.5 sm:gap-2 group cursor-default">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg bg-amber-500 shadow-md shadow-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sun className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
          </div>
          <span className="text-watchman-muted group-hover:text-white transition-colors">Day</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 group cursor-default">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg bg-indigo-500 shadow-md shadow-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Moon className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
          </div>
          <span className="text-watchman-muted group-hover:text-white transition-colors">Night</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 group cursor-default">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg bg-emerald-500 shadow-md shadow-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Coffee className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
          </div>
          <span className="text-watchman-muted group-hover:text-white transition-colors">Off</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 group cursor-default">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 shadow-md shadow-teal-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plane className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
          </div>
          <span className="text-watchman-muted group-hover:text-white transition-colors">Leave</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 group cursor-default">
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

function MiniMonth({
  year,
  monthIndex,
  daysMap,
  todayIso,
  horizonEnd,
  muted,
}: {
  year: number;
  monthIndex: number;
  daysMap: Map<string, CalendarDay>;
  todayIso: string;
  horizonEnd: string | null;
  muted?: boolean;
}) {
  const cells = monthMiniCells(year, monthIndex);
  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAY_INITIALS.map((label, index) => (
          <span key={`${monthIndex}-${label}-${index}`} className="text-center text-[8px] font-medium text-zinc-400">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell) => {
          if (!cell.date) return <span key={cell.key} className="aspect-square" />;
          const past = !muted && isDayPastFreeHorizon(cell.date, horizonEnd);
          const kind = muted || past ? 'muted' : calendarCellKind(daysMap.get(cell.date));
          const isTodayCell = cell.date === todayIso;
          return (
            <span
              key={cell.key}
              data-date={cell.date}
              data-kind={kind}
              data-today={isTodayCell ? 'true' : undefined}
              className={cn(
                'aspect-square rounded-[2px]',
                isTodayCell && 'ring-2 ring-white',
                kind === 'work_day' && 'bg-amber-500',
                kind === 'work_night' && 'bg-indigo-500',
                kind === 'off' && 'bg-emerald-500',
                kind === 'leave' && 'bg-teal-500',
                (kind === 'empty' || kind === 'blank' || kind === 'muted') && 'bg-white/10',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

function MonthStatLines({
  stats,
}: {
  stats: { dayShifts: number; nightShifts: number; offDays: number; leaveDays: number };
}) {
  return (
    <div className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 pt-3 text-[10px] min-h-[2.75rem]">
      <span className="flex items-center gap-1 text-amber-400">
        <Sun className="w-3 h-3 shrink-0" />
        {stats.dayShifts} days
      </span>
      <span className="flex items-center gap-1 text-indigo-400">
        <Moon className="w-3 h-3 shrink-0" />
        {stats.nightShifts} nights
      </span>
      <span className="flex items-center gap-1 text-emerald-400">
        <Coffee className="w-3 h-3 shrink-0" />
        {stats.offDays} off
      </span>
      <span className="flex items-center gap-1 text-teal-400">
        <Plane className="w-3 h-3 shrink-0" />
        {stats.leaveDays} leave
      </span>
    </div>
  );
}

// Year Overview Component
interface YearOverviewProps {
  days: CalendarDay[];
  year: number;
  onSelectMonth: (month: Date) => void;
  userTier?: 'free' | 'pro' | 'admin';
  freeHorizonEnd?: string | null;
}

export function YearOverview({ days, year, onSelectMonth, userTier = 'free', freeHorizonEnd = null }: YearOverviewProps) {
  const lockedPriceLine = useLockedMonthPrice(userTier);
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

      // Calculate stats for this month
      const crossesHorizon = daysInMonth.some(({ date }) => isDayPastFreeHorizon(format(date, 'yyyy-MM-dd'), freeHorizonEnd));
      const stats = yearMonthShiftCounts(
        daysInMonth.flatMap(({ day }) => day ? [{
          date: day.date,
          work_type: day.work_type,
          is_leave: day.is_leave,
        }] : []),
        freeHorizonEnd,
      );

      return { month: monthStart, days: daysInMonth, stats, crossesHorizon };
    });
  }, [year, daysMap, freeHorizonEnd]);

  const today = new Date();
  const todayIso = format(today, 'yyyy-MM-dd');
  const lockedIndexes = months.flatMap((_, index) => {
    const pastHorizon = isMonthEntirelyPastHorizon(year, index, freeHorizonEnd);
    const monthLocked = !isYearMonthVisible(index, year, today, userTier);
    return pastHorizon || monthLocked ? [index] : [];
  });
  const lockedLabel = lockedMonthSpanLabel(year, lockedIndexes);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
      {lockedLabel && (
        <div className="col-span-full rounded-2xl border border-white/10 bg-watchman-bg p-4 flex flex-col sm:flex-row sm:items-center gap-3" data-testid="year-lock-banner">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{SEE_FURTHER_AHEAD}</p>
            <p className="text-xs text-zinc-300 mt-1">{FREE_HORIZON_MESSAGE}</p>
            <p className="text-xs text-zinc-300 mt-1">{lockedLabel} is outside the free plan.</p>
            <LockedAheadDetails priceLine={lockedPriceLine} />
          </div>
          <Link href="/pricing" className="inline-flex items-center justify-center rounded-xl bg-watchman-accent px-4 py-2 text-sm font-medium text-white shrink-0">
            Upgrade
          </Link>
        </div>
      )}
      {months.map(({ month, stats, crossesHorizon }, index) => {
        const locked = lockedIndexes.includes(index);
        const monthName = format(month, 'MMMM');
        if (locked) {
          return (
            <div
              key={format(month, 'yyyy-MM')}
              className="p-4 h-full flex flex-col glass rounded-2xl border border-white/5 text-left opacity-60"
              data-locked-month="true"
            >
              <h3 className="text-sm font-semibold mb-3 text-watchman-muted min-h-[1.25rem]">{monthName}</h3>
              <MiniMonth
                year={year}
                monthIndex={index}
                daysMap={daysMap}
                todayIso={todayIso}
                horizonEnd={freeHorizonEnd}
                muted
              />
            </div>
          );
        }

        return (
          <button
            key={format(month, 'yyyy-MM')}
            type="button"
            onClick={() => onSelectMonth(month)}
            className="p-4 h-full flex flex-col glass rounded-2xl border border-white/5 hover:border-watchman-accent/30 transition-colors text-left group"
          >
            <h3 className="text-sm font-semibold mb-3 min-h-[1.25rem] group-hover:text-watchman-accent transition-colors">
              {monthName}
            </h3>
            <MiniMonth
              year={year}
              monthIndex={index}
              daysMap={daysMap}
              todayIso={todayIso}
              horizonEnd={freeHorizonEnd}
            />
            <MonthStatLines stats={stats} />
            {crossesHorizon && horizonThroughLabel(freeHorizonEnd) && (
              <p className="mt-2 text-[10px] text-zinc-300">Free plan {horizonThroughLabel(freeHorizonEnd)}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}
