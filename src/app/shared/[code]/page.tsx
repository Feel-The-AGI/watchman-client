'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { Sun, Moon, Coffee, Plane, ChevronLeft, ChevronRight, AlertCircle, Share2, Calendar as CalendarIcon } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SharedDay {
  date: string;
  cycle_day?: number;
  work_type?: 'work_day' | 'work_night' | 'off' | null;
  is_leave?: boolean;
  commitments?: { type: string; name: string; hours?: number }[];
}

interface SharedCalendarData {
  name: string;
  owner_name: string;
  year: number;
  days: SharedDay[];
  settings: {
    show_work_types: boolean;
    show_commitments: boolean;
  };
}

const workTypeConfig: Record<string, {
  bg: string;
  gradient: string;
  icon: typeof Sun;
  label: string;
}> = {
  work_day: {
    bg: 'bg-amber-500',
    gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
    icon: Sun,
    label: 'Day Shift',
  },
  work_night: {
    bg: 'bg-indigo-500',
    gradient: 'from-indigo-500/20 via-indigo-500/10 to-transparent',
    icon: Moon,
    label: 'Night Shift',
  },
  off: {
    bg: 'bg-emerald-500',
    gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    icon: Coffee,
    label: 'Off Day',
  },
};

export default function SharedCalendarPage() {
  const params = useParams();
  const shareCode = params.code as string;

  const [data, setData] = useState<SharedCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    async function fetchSharedCalendar() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sharing/public/${shareCode}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.detail || 'Failed to load shared calendar');
        }

        setData(result.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load shared calendar');
      } finally {
        setLoading(false);
      }
    }

    if (shareCode) {
      fetchSharedCalendar();
    }
  }, [shareCode]);

  const daysMap = useMemo(() => {
    const map = new Map<string, SharedDay>();
    data?.days.forEach((day) => {
      map.set(day.date, day);
    });
    return map;
  }, [data?.days]);

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

  const navigateMonth = (dir: 'prev' | 'next') => {
    setDirection(dir === 'prev' ? -1 : 1);
    setCurrentMonth(dir === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) {
    return (
      <div className="min-h-screen bg-watchman-bg flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-watchman-accent/20 border-t-watchman-accent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-watchman-accent" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-watchman-bg flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Calendar Not Found</h1>
          <p className="text-watchman-muted mb-6">{error}</p>
          <Link href="/" className="text-watchman-accent hover:underline">
            Go to Watchman
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-watchman-bg text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-watchman-accent/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-watchman-purple/5 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-xl font-bold tracking-tight">Watchman</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-watchman-accent hover:text-white transition-colors"
          >
            Create Your Own
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="relative pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-4">
              <Share2 className="w-4 h-4 text-watchman-accent" />
              <span className="text-sm text-watchman-muted">Shared Calendar</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{data?.name}</h1>
            <p className="text-watchman-muted">
              Shared by <span className="text-white">{data?.owner_name}</span>
            </p>
          </motion.div>

          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-3xl overflow-hidden border border-white/10"
          >
            {/* Header with Month Navigation */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-3 rounded-xl glass hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>

              <button
                onClick={() => navigateMonth('next')}
                className="p-3 rounded-xl glass hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
              {weekDays.map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    'px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider',
                    i >= 5 ? 'text-watchman-muted/60' : 'text-watchman-muted'
                  )}
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
                const today = isToday(day);

                const workConfig = calendarDay?.work_type && data?.settings.show_work_types
                  ? workTypeConfig[calendarDay.work_type]
                  : null;

                const isLeave = calendarDay?.is_leave && data?.settings.show_work_types;
                const hasCommitments = calendarDay?.commitments && calendarDay.commitments.length > 0 && data?.settings.show_commitments;

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      'relative aspect-square p-1.5 border-r border-b border-white/5',
                      !inCurrentMonth && 'opacity-25',
                      workConfig && inCurrentMonth && `bg-gradient-to-br ${workConfig.gradient}`
                    )}
                  >
                    <div className="h-full flex flex-col">
                      {/* Date Number */}
                      <div className="flex items-center justify-between px-1">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            today && 'text-watchman-accent font-bold',
                            !inCurrentMonth && 'text-watchman-muted/50'
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>

                      {/* Work Type Indicator */}
                      <div className="flex-1 flex flex-col justify-center items-center gap-1.5 py-1">
                        {workConfig && inCurrentMonth && (
                          <div
                            className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center shadow-lg',
                              workConfig.bg
                            )}
                          >
                            <workConfig.icon className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {isLeave && inCurrentMonth && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
                            <Plane className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {hasCommitments && inCurrentMonth && (
                          <div className="flex gap-1">
                            {calendarDay.commitments?.slice(0, 3).map((_, i) => (
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
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                          <div className="w-1.5 h-1.5 rounded-full bg-watchman-accent animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            {data?.settings.show_work_types && (
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-4 border-t border-white/5 text-xs bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Sun className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-watchman-muted">Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <Moon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-watchman-muted">Night</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <Coffee className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-watchman-muted">Off</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                    <Plane className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-watchman-muted">Leave</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <p className="text-watchman-muted mb-4">
              Want to create your own shift calendar?
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-watchman-accent to-watchman-purple text-white font-medium shadow-lg shadow-watchman-accent/30 hover:shadow-watchman-accent/50 transition-shadow"
            >
              <CalendarIcon className="w-5 h-5" />
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative py-8 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-watchman-muted hover:text-white transition-colors">
            <Logo size="sm" />
            <span className="font-semibold">Watchman</span>
          </Link>
          <p className="text-xs text-watchman-muted/60 mt-2">
            Your conversational calendar for shift work
          </p>
        </div>
      </footer>
    </div>
  );
}
