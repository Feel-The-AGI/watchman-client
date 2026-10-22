'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { gridMonthAfterViewToggle, headerYear, monthToShow, selectedDateAfterMonthChange, shiftViewedMonth, yearToLoad } from '@/lib/calendar-view';
import { 
  Calendar as CalendarIcon, 
  Grid3X3, 
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Coffee,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Zap,
  BarChart2,
  Plane,
} from 'lucide-react';
import { CalendarGrid, YearOverview, DayInspector, type CalendarDay } from '@/components/calendar';
import { ChatPanel } from '@/components/chat';
import { Button } from '@/components/ui/Button';
import { BlockSkeleton, LoadingState } from '@/components/ui/LoadingState';
import { Card, CardContent, CardHeader, CardTitle, BentoCard } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import {
  cachedCalendarYear,
  cachedCycles,
  calendarLoadFailed,
  invalidateCalendar,
  refreshCalendarYears,
  setViewedCalendarYear,
  subscribeCalendarCache,
} from '@/lib/calendar-sync';
import { normalizeCalendarDays } from '@/lib/calendar-day';
import { activeCyclePattern, type BadgeBlock } from '@/lib/cycle-day-badge';
import { parseDateOnly } from '@/lib/date-only';
import {
  freeHorizonNotice,
  FREE_HORIZON_MESSAGE,
  horizonThroughLabel,
  readCalendarYearPayload,
  shiftCountsThroughHorizon,
} from '@/lib/free-horizon';
import { FreeHorizonNotice } from '@/components/upgrade/FreeHorizonNotice';
import Link from 'next/link';

type ViewMode = 'month' | 'year';

interface CalendarStats {
  total_days: number;
  work_days: number;
  work_nights: number;
  off_days: number;
  leave_days: number;
  study_hours: number;
  commitment_count: number;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewedMonth, setViewedMonth] = useState(() => gridMonthAfterViewToggle(new Date()));
  const viewedYearRef = useRef(headerYear(viewedMonth));
  const [initialYearSet, setInitialYearSet] = useState(false);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [rotationPattern, setRotationPattern] = useState<BadgeBlock[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [freeHorizonEnd, setFreeHorizonEnd] = useState<string | null>(null);
  const horizonCounts = freeHorizonEnd ? shiftCountsThroughHorizon(calendarDays, freeHorizonEnd) : null;
  const horizonLabel = parseDateOnly(freeHorizonEnd)?.year === headerYear(viewedMonth) ? horizonThroughLabel(freeHorizonEnd) : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [hasSetup, setHasSetup] = useState(false);

  // Use ref to track current year to avoid stale closures
  const currentYearRef = useRef(currentYear);
  currentYearRef.current = currentYear;

  const applyCachedYear = useCallback((year: number) => {
    const cycleList = cachedCycles();
    if (Array.isArray(cycleList)) {
      setHasSetup(cycleList.length > 0);
      setRotationPattern(activeCyclePattern(cycleList));
    }
    const entry = cachedCalendarYear(year);
    if (!entry?.calendar) return;
    const view = readCalendarYearPayload(entry.calendar);
    setCalendarDays(normalizeCalendarDays(view.days) as CalendarDay[]);
    setFreeHorizonEnd(view.horizonEnd);
    if (entry.stats) setStats(entry.stats as CalendarStats);
    setLoadFailed(false);
    setError(null);
  }, []);

  const fetchCalendarData = useCallback(async (yearOverride?: number) => {
    let yearToFetch = yearOverride ?? currentYearRef.current;
    const sameYear = yearToFetch === viewedYearRef.current;
    const cached = cachedCalendarYear(yearToFetch);
    if (!sameYear && cached?.calendar) {
      applyCachedYear(yearToFetch);
    } else if (calendarDays.length === 0 || !sameYear) {
      setLoading(true);
      setError(null);
      if (!sameYear && !cached?.calendar) setCalendarDays([]);
    }

    let fetchYear = yearToFetch;

    try {
      const loaded = await refreshCalendarYears([yearToFetch]);
      if (yearToFetch !== viewedYearRef.current) return;
      if (calendarLoadFailed(loaded, yearToFetch)) {
        setLoadFailed(true);
        setError('Failed to load calendar');
        return;
      }
      setLoadFailed(false);
      const cyclesResponse = cachedCycles();
      if (!Array.isArray(cyclesResponse) || cyclesResponse.length === 0) {
        setHasSetup(false);
        return;
      }
      setHasSetup(true);
      setRotationPattern(activeCyclePattern(cyclesResponse));

      const activeCycle = cyclesResponse.find((c: any) => c.is_active) || cyclesResponse[0];
      if (!initialYearSet && activeCycle?.anchor_date && yearOverride == null) {
        const anchorYear = parseDateOnly(activeCycle.anchor_date)?.year;
        if (anchorYear != null && anchorYear >= new Date().getFullYear() && anchorYear !== yearToFetch) {
          setCurrentYear(anchorYear);
          setViewedMonth((current) => new Date(anchorYear, current.getMonth(), 1));
          viewedYearRef.current = anchorYear;
          setViewedCalendarYear(anchorYear);
          fetchYear = anchorYear;
          const anchorLoaded = await refreshCalendarYears([anchorYear]);
          if (fetchYear !== viewedYearRef.current) return;
          if (calendarLoadFailed(anchorLoaded, fetchYear)) {
            setLoadFailed(true);
            setError('Failed to load calendar');
            return;
          }
        }
        setInitialYearSet(true);
      }

      if (fetchYear !== viewedYearRef.current) return;
      applyCachedYear(fetchYear);
    } catch (err: any) {
      if (fetchYear !== viewedYearRef.current) return;
      console.error('Failed to fetch calendar:', err);
      setLoadFailed(true);
      setError(freeHorizonNotice(err) ? FREE_HORIZON_MESSAGE : 'Failed to load calendar');
    } finally {
      if (fetchYear === viewedYearRef.current) {
        setLoading(false);
      }
    }
  }, [initialYearSet, calendarDays.length, applyCachedYear]);

  useEffect(() => {
    setViewedCalendarYear(headerYear(viewedMonth));
  }, [viewedMonth]);

  useEffect(() => {
    const stop = subscribeCalendarCache(() => {
      applyCachedYear(viewedYearRef.current);
    });
    return stop;
  }, [applyCachedYear]);

  // Initial fetch only. Later edits come through the shared calendar cache.
  useEffect(() => {
    const cached = cachedCalendarYear(currentYearRef.current);
    if (cached?.calendar) {
      applyCachedYear(currentYearRef.current);
      setLoading(false);
      void refreshCalendarYears([currentYearRef.current]);
      return;
    }
    fetchCalendarData();
  }, []);

  const showMonth = (month: Date) => {
    const tier = profile?.tier === 'pro' || profile?.tier === 'admin' ? profile.tier : 'free';
    const next = monthToShow(month, new Date(), tier);
    if (!next) return;
    setSelectedDate((current) => selectedDateAfterMonthChange(current, next));
    viewedYearRef.current = headerYear(next);
    setViewedCalendarYear(headerYear(next));
    setViewedMonth(next);
    const year = yearToLoad(currentYearRef.current, next);
    if (year !== null) {
      setCurrentYear(year);
      fetchCalendarData(year);
    }
  };

  const selectedDayData = selectedDate 
    ? calendarDays.find(d => d.date === format(selectedDate, 'yyyy-MM-dd')) || null
    : null;

  if (!loading && loadFailed) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Failed to load calendar</h1>
        <p className="text-watchman-text-secondary mb-8">{error}</p>
        <Button variant="primary" onClick={() => { void fetchCalendarData(); }}>
          Retry
        </Button>
      </div>
    );
  }

  if (!loading && error && !hasSetup) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Watchman is unavailable</h1>
        <p className="text-watchman-text-secondary mb-8">{error}</p>
        <Button variant="primary" onClick={() => fetchCalendarData()}>
          Try again
        </Button>
      </div>
    );
  }

  // No setup state - Premium empty state
  if (!loading && !hasSetup) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Animated gradient orb */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-watchman-accent to-watchman-purple rounded-full blur-2xl opacity-30 animate-pulse-soft" />
            <div className="relative w-32 h-32 rounded-full glass border border-white/10 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-watchman-accent" />
            </div>
          </div>
          
          <h1 className="text-display-sm mb-4">Welcome to Watchman</h1>
          <p className="text-xl text-watchman-text-secondary mb-8 max-w-md mx-auto">
            You haven&apos;t set up your rotation yet. Let&apos;s define your cycle pattern 
            and generate your calendar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/onboarding">
              <Button variant="primary" size="xl" className="group">
                Start Setup
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/dashboard/rules">
              <Button variant="glass" size="xl">
                Manual Setup
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4">
        {/* Top row: Year navigation and title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Year Navigation */}
            <motion.button
              onClick={() => showMonth(shiftViewedMonth(viewedMonth, -12))}
              className="p-2 sm:p-2.5 rounded-xl glass border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>

            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                <span className="text-gradient">{headerYear(viewedMonth)}</span> <span className="hidden sm:inline">Calendar</span>
              </h1>
              <p className="text-watchman-text-secondary text-xs sm:text-sm hidden sm:block">
                {profile?.name ? `${profile.name}'s schedule` : 'Your schedule overview'}
              </p>
            </div>

            <motion.button
              onClick={() => showMonth(shiftViewedMonth(viewedMonth, 12))}
              className="p-2 sm:p-2.5 rounded-xl glass border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>

          {/* Refresh Button - always visible on the right */}
          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="sm"
              onClick={() => { void invalidateCalendar(); }}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Bottom row: View Mode Toggle - full width on mobile */}
        <div className="flex items-center justify-center sm:justify-start">
          <div className="flex items-center glass rounded-xl p-1 border border-white/5 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                viewMode === 'month'
                  ? 'bg-watchman-accent text-white shadow-lg shadow-watchman-accent/30'
                  : 'text-watchman-muted hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                viewMode === 'year'
                  ? 'bg-watchman-accent text-white shadow-lg shadow-watchman-accent/30'
                  : 'text-watchman-muted hover:text-white'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Year
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl glass-accent border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-watchman-error flex-shrink-0" />
            {error === FREE_HORIZON_MESSAGE ? (
              <div className="flex-1">
                <FreeHorizonNotice compact />
              </div>
            ) : (
              <>
                <p className="text-sm text-watchman-error">{error}</p>
                <Button variant="ghost" size="sm" onClick={() => fetchCalendarData()} className="ml-auto">
                  Retry
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <LoadingState title="Loading your calendar…" detail="Fetching this year's rotation. This can take a few seconds.">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <BlockSkeleton className="lg:col-span-8 h-80" />
            <BlockSkeleton className="lg:col-span-4 h-80" />
          </div>
        </LoadingState>
      )}

      {/* Main Bento Layout */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Calendar - Main Focus */}
          <motion.div 
            className="lg:col-span-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card variant="glass" padding="none" className="overflow-hidden">
              {viewMode === 'month' ? (
                <CalendarGrid
                  days={calendarDays}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  initialMonth={gridMonthAfterViewToggle(viewedMonth)}
                  onMonthChange={showMonth}
                  userTier={profile?.tier as 'free' | 'pro' | 'admin' || 'free'}
                  pattern={rotationPattern}
                  freeHorizonEnd={freeHorizonEnd}
                />
              ) : (
                <div className="p-6">
                  <YearOverview
                    days={calendarDays}
                    year={headerYear(viewedMonth)}
                    onSelectMonth={(month) => {
                      showMonth(month);
                      setViewMode('month');
                    }}
                    userTier={profile?.tier as 'free' | 'pro' | 'admin' || 'free'}
                    freeHorizonEnd={freeHorizonEnd}
                  />
                </div>
              )}
            </Card>
          </motion.div>

          {/* Right Sidebar - Chat + Stats */}
          <div className="lg:col-span-4 space-y-4">
            {/* Chat Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ChatPanel
                className="h-[420px]"
                autoExecute={false}
                userTier={profile?.tier as 'free' | 'pro' || 'free'}
              />
            </motion.div>

            {/* Day Inspector or Stats */}
            <AnimatePresence mode="wait">
              {selectedDate ? (
                <motion.div
                  key="inspector"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <DayInspector
                    date={selectedDate}
                    dayData={selectedDayData}
                    onClose={() => setSelectedDate(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Quick Stats Grid */}
                  {stats && horizonLabel && (
                    <p className="text-xs text-watchman-muted">{horizonLabel}</p>
                  )}
                  {stats && (
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard
                        icon={<Sun className="w-4 h-4" />}
                        label="Day Shifts"
                        value={horizonCounts ? horizonCounts.work_days : stats.work_days}
                        color="bg-work-day"
                        glow="shadow-work-day/30"
                      />
                      <StatCard
                        icon={<Moon className="w-4 h-4" />}
                        label="Night Shifts"
                        value={horizonCounts ? horizonCounts.work_nights : stats.work_nights}
                        color="bg-work-night"
                        glow="shadow-work-night/30"
                      />
                      <StatCard
                        icon={<Coffee className="w-4 h-4" />}
                        label="Off Days"
                        value={horizonCounts ? horizonCounts.off_days : stats.off_days}
                        color="bg-work-off"
                        glow="shadow-work-off/30"
                      />
                      <StatCard
                        icon={<Plane className="w-4 h-4" />}
                        label="Leave Days"
                        value={horizonCounts ? horizonCounts.leave_days : stats.leave_days}
                        color="bg-commit-leave"
                        glow="shadow-commit-leave/30"
                      />
                    </div>
                  )}

                  {/* Stats Summary Card */}
                  {stats && (
                    <Card variant="glass" className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart2 className="w-5 h-5 text-watchman-accent" />
                        <span className="font-medium">Year Overview</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-watchman-muted">Study Hours</span>
                          <span className="font-semibold text-watchman-accent">{stats.study_hours}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-watchman-muted">Commitments</span>
                          <span className="font-semibold">{stats.commitment_count}</span>
                        </div>
                        <div className="pt-3 border-t border-white/5">
                          <Link href="/dashboard/stats">
                            <Button variant="ghost" size="sm" className="w-full justify-center gap-2 group">
                              View Detailed Stats
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Tip Card */}
                  <Card variant="outline" className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-watchman-accent/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-watchman-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-watchman-text-secondary">
                          <span className="font-medium text-white">Tip:</span> Click any day to see details, 
                          or chat with the agent to make changes.
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

// Premium Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  glow: string;
}

function StatCard({ icon, label, value, color, glow }: StatCardProps) {
  return (
    <motion.div
      data-stat={label}
      className="p-4 rounded-2xl glass border border-white/5 hover:border-white/10 transition-all group"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center text-white shadow-lg ${glow}`}>
          {icon}
        </div>
        <span className="text-xs text-watchman-muted">{label}</span>
      </div>
      <p data-stat-value className="text-2xl font-bold tracking-tight">{value}</p>
    </motion.div>
  );
}
