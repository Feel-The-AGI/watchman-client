'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
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
  ChevronRight
} from 'lucide-react';
import { CalendarGrid, YearOverview, DayInspector, type CalendarDay } from '@/components/calendar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
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
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSetup, setHasSetup] = useState(false);

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user has set up their cycle
      const cyclesResponse = await api.cycles.list();
      if (!cyclesResponse || cyclesResponse.length === 0) {
        setHasSetup(false);
        setLoading(false);
        return;
      }
      setHasSetup(true);

      // If we're on the first load, use the cycle's anchor year
      const activeCycle = cyclesResponse.find((c: any) => c.is_active) || cyclesResponse[0];
      if (activeCycle?.anchor_date) {
        const anchorYear = new Date(activeCycle.anchor_date).getFullYear();
        // Only auto-set year if it's different and we haven't manually changed it
        if (anchorYear !== currentYear && anchorYear >= new Date().getFullYear()) {
          setCurrentYear(anchorYear);
          return; // Will re-fetch with new year
        }
      }

      // Fetch calendar for current year
      // After unwrapping, this is the days array directly
      const calendarResponse = await api.calendar.getYear(currentYear);
      setCalendarDays(calendarResponse || []);

      // Fetch stats
      // After unwrapping, this is the stats object directly
      const statsResponse = await api.stats.getSummary(currentYear);
      setStats(statsResponse || null);
    } catch (err: any) {
      console.error('Failed to fetch calendar:', err);
      setError(err.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const selectedDayData = selectedDate 
    ? calendarDays.find(d => d.date === format(selectedDate, 'yyyy-MM-dd')) || null
    : null;

  // No setup state
  if (!loading && !hasSetup) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-watchman-accent/10 border border-watchman-accent/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-watchman-accent" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Welcome to Watchman</h1>
          <p className="text-watchman-muted mb-8 max-w-md mx-auto">
            You haven&apos;t set up your rotation yet. Define your cycle pattern 
            and constraints to generate your calendar.
          </p>

          <Link href="/dashboard/rules">
            <Button variant="primary" size="lg" className="gap-2">
              Set Up Your Rotation
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Year Navigation */}
          <button
            onClick={() => setCurrentYear(y => y - 1)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {currentYear} Calendar
            </h1>
            <p className="text-watchman-muted">
              {profile?.name ? `${profile.name}'s schedule` : 'Your schedule overview'}
            </p>
          </div>
          <button
            onClick={() => setCurrentYear(y => y + 1)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-watchman-surface rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-watchman-accent text-white'
                  : 'text-watchman-muted hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Month
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'year'
                  ? 'bg-watchman-accent text-white'
                  : 'text-watchman-muted hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Year
            </button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchCalendarData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-watchman-error/10 border border-watchman-error/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-watchman-error flex-shrink-0" />
          <p className="text-sm text-watchman-error">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchCalendarData}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-watchman-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="grid lg:grid-cols-[1fr,340px] gap-6">
          {/* Calendar */}
          <div>
            {viewMode === 'month' ? (
              <CalendarGrid
                days={calendarDays}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            ) : (
              <YearOverview
                days={calendarDays}
                year={currentYear}
                onSelectMonth={(month) => {
                  setViewMode('month');
                  setSelectedDate(month);
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Day Inspector or Quick Stats */}
            <AnimatePresence mode="wait">
              {selectedDate ? (
                <DayInspector
                  key="inspector"
                  date={selectedDate}
                  dayData={selectedDayData}
                  onClose={() => setSelectedDate(null)}
                />
              ) : (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Quick Stats */}
                  {stats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-watchman-accent" />
                          Year Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <StatBlock
                            icon={<Sun className="w-4 h-4" />}
                            label="Day Shifts"
                            value={stats.work_days}
                            color="bg-work-day"
                          />
                          <StatBlock
                            icon={<Moon className="w-4 h-4" />}
                            label="Night Shifts"
                            value={stats.work_nights}
                            color="bg-work-night"
                          />
                          <StatBlock
                            icon={<Coffee className="w-4 h-4" />}
                            label="Off Days"
                            value={stats.off_days}
                            color="bg-work-off"
                          />
                          <StatBlock
                            icon={<CalendarIcon className="w-4 h-4" />}
                            label="Leave Days"
                            value={stats.leave_days}
                            color="bg-watchman-mint"
                          />
                        </div>

                        <div className="pt-4 border-t border-white/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-watchman-muted">Study Hours</span>
                            <span className="font-semibold">{stats.study_hours}h</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-watchman-muted">Commitments</span>
                            <span className="font-semibold">{stats.commitment_count}</span>
                          </div>
                        </div>

                        <Link href="/dashboard/stats" className="block pt-2">
                          <Button variant="ghost" size="sm" className="w-full gap-2">
                            View Detailed Stats
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tip Card */}
                  <Card className="mt-6">
                    <CardContent className="pt-6">
                      <p className="text-sm text-watchman-muted mb-3">
                        <span className="font-medium text-white">Pro tip:</span> Click on any 
                        day to see details and manage commitments.
                      </p>
                      <Link href="/dashboard/proposals">
                        <Button variant="primary" size="sm" className="w-full gap-2">
                          <Sparkles className="w-4 h-4" />
                          Propose a Change
                        </Button>
                      </Link>
                    </CardContent>
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

// Stat Block Component
interface StatBlockProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatBlock({ icon, label, value, color }: StatBlockProps) {
  return (
    <div className="p-3 bg-watchman-bg rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className="text-xs text-watchman-muted">{label}</span>
      </div>
      <p className="text-xl font-bold pl-8">{value}</p>
    </div>
  );
}
