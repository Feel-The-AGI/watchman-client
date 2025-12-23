'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Sun,
  Moon,
  Coffee,
  BookOpen,
  Plane,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Table,
  Sparkles,
  Zap,
  Clock,
  Target,
  Trophy,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface YearStats {
  year: number;
  total_days: number;
  work_days: number;
  work_nights: number;
  off_days: number;
  leave_days: number;
  study_hours: number;
  commitment_count: number;
  monthly_breakdown: MonthlyStats[];
  peak_weeks: WeekStats[];
  commitment_breakdown: CommitmentStats[];
}

interface MonthlyStats {
  month: string;
  work_days: number;
  work_nights: number;
  off_days: number;
  leave_days: number;
  study_hours: number;
}

interface WeekStats {
  week_start: string;
  week_end: string;
  total_hours: number;
  is_overloaded: boolean;
}

interface CommitmentStats {
  id: string;
  name: string;
  type: string;
  total_hours: number;
  sessions_count: number;
}

const COLORS = {
  work_day: '#F59E0B',
  work_night: '#6366F1',
  off: '#10B981',
  leave: '#14B8A6',
  study: '#3B82F6',
  accent: '#3B82F6',
};

export default function StatsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<YearStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [year]);

  useEffect(() => {
    if (stats) {
      setAnimateStats(true);
    }
  }, [stats]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      setAnimateStats(false);
      const response = await api.stats.getDetailed(year);
      if (response) {
        // Ensure all required properties have defaults
        setStats({
          year: response.year || year,
          total_days: response.total_days || 0,
          work_days: response.work_days || 0,
          work_nights: response.work_nights || 0,
          off_days: response.off_days || 0,
          leave_days: response.leave_days || 0,
          study_hours: response.study_hours || 0,
          commitment_count: response.commitment_count || 0,
          monthly_breakdown: response.monthly_breakdown || [],
          peak_weeks: response.peak_weeks || [],
          commitment_breakdown: response.commitment_breakdown || [],
        });
      } else {
        // Empty data is okay - just show empty state
        setStats(null);
      }
    } catch (err: any) {
      console.error('Stats fetch error:', err);
      // Don't crash - show empty state instead
      setStats(null);
      if (err.status !== 404) {
        setError(err.message || 'Failed to load statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (exportFormat: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      const blob = await api.stats.export(year, exportFormat);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watchman-stats-${year}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  // Chart data transformations
  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Day Shifts', value: stats.work_days, color: COLORS.work_day },
      { name: 'Night Shifts', value: stats.work_nights, color: COLORS.work_night },
      { name: 'Off Days', value: stats.off_days, color: COLORS.off },
      { name: 'Leave Days', value: stats.leave_days, color: COLORS.leave },
    ].filter(d => d.value > 0);
  }, [stats]);

  const monthlyChartData = useMemo(() => {
    if (!stats?.monthly_breakdown) return [];
    return stats.monthly_breakdown.map(m => ({
      month: format(new Date(m.month), 'MMM'),
      'Day Shifts': m.work_days,
      'Night Shifts': m.work_nights,
      'Off Days': m.off_days,
      'Study Hours': m.study_hours,
    }));
  }, [stats]);

  const studyHoursData = useMemo(() => {
    if (!stats?.monthly_breakdown) return [];
    return stats.monthly_breakdown.map(m => ({
      month: format(new Date(m.month), 'MMM'),
      hours: m.study_hours,
    }));
  }, [stats]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center shadow-lg shadow-watchman-accent/30">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            Statistics
          </h1>
          <p className="text-watchman-muted mt-1">
            Detailed insights into your schedule
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          {/* Year Selector */}
          <div className="flex items-center glass rounded-2xl border border-white/10 overflow-hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setYear(y => y - 1)}
              className="p-3 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <span className="px-6 font-bold text-lg">{year}</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setYear(y => y + 1)}
              className="p-3 hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button
              variant="glass"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={exporting || !stats}
              className="gap-2"
            >
              <Table className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="glass"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={exporting || !stats}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl glass border border-red-500/30 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchStats} className="ml-auto gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-2 border-watchman-accent border-t-transparent mb-4"
          />
          <p className="text-watchman-muted">Loading your statistics...</p>
        </div>
      )}

      {/* Stats Content */}
      {!loading && stats && (
        <>
          {/* Summary Cards - Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Calendar, label: 'Total Days', value: stats.total_days, color: 'from-watchman-accent to-watchman-purple', glow: 'shadow-watchman-accent/30' },
              { icon: Sun, label: 'Day Shifts', value: stats.work_days, color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30' },
              { icon: Moon, label: 'Night Shifts', value: stats.work_nights, color: 'from-indigo-500 to-purple-600', glow: 'shadow-indigo-500/30' },
              { icon: Coffee, label: 'Off Days', value: stats.off_days, color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30' },
              { icon: Plane, label: 'Leave Days', value: stats.leave_days, color: 'from-teal-400 to-cyan-600', glow: 'shadow-teal-500/30' },
              { icon: BookOpen, label: 'Study Hours', value: stats.study_hours, suffix: 'h', color: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/30' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={animateStats ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="glass rounded-2xl border border-white/10 p-5 group cursor-default"
              >
                <div className={cn(
                  'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110',
                  stat.color,
                  stat.glow
                )}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <motion.p 
                  className="text-3xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={animateStats ? { opacity: 1 } : {}}
                  transition={{ delay: i * 0.05 + 0.2 }}
                >
                  {stat.value.toLocaleString()}{stat.suffix}
                </motion.p>
                <p className="text-sm text-watchman-muted mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Distribution Pie Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-watchman-accent" />
                </div>
                <h3 className="text-lg font-semibold">Day Distribution</h3>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="transparent"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(24, 24, 27, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Custom Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-watchman-muted">{item.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Monthly Study Hours */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold">Study Hours Trend</h3>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={studyHoursData}>
                    <defs>
                      <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.study} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={COLORS.study} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <YAxis stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(24, 24, 27, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke={COLORS.study}
                      strokeWidth={3}
                      fill="url(#studyGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Monthly Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-3xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold">Monthly Breakdown</h3>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Day Shifts" fill={COLORS.work_day} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Night Shifts" fill={COLORS.work_night} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Off Days" fill={COLORS.off} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Additional Stats Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Peak Weeks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold">Peak Weeks</h3>
              </div>
              {stats.peak_weeks && stats.peak_weeks.length > 0 ? (
                <div className="space-y-3">
                  {stats.peak_weeks.slice(0, 5).map((week, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className={cn(
                        'p-4 rounded-2xl flex items-center justify-between transition-all cursor-default',
                        week.is_overloaded
                          ? 'bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20'
                          : 'glass'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {week.is_overloaded && (
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {format(new Date(week.week_start), 'MMM d')} - {format(new Date(week.week_end), 'MMM d')}
                          </p>
                          {week.is_overloaded && (
                            <p className="text-xs text-red-400">High workload</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{week.total_hours}h</p>
                        <p className="text-xs text-watchman-muted">study</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-watchman-muted/30" />
                  <p className="text-watchman-muted">No peak weeks data</p>
                </div>
              )}
            </motion.div>

            {/* Commitments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-watchman-accent" />
                </div>
                <h3 className="text-lg font-semibold">Commitments</h3>
              </div>
              {stats.commitment_breakdown && stats.commitment_breakdown.length > 0 ? (
                <div className="space-y-4">
                  {stats.commitment_breakdown.map((commitment, i) => (
                    <motion.div
                      key={commitment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className="glass rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{commitment.name}</p>
                          <p className="text-xs text-watchman-muted capitalize">{commitment.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-watchman-accent">{commitment.total_hours}h</p>
                          <p className="text-xs text-watchman-muted">{commitment.sessions_count} sessions</p>
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((commitment.total_hours / (stats.study_hours || 1)) * 100, 100)}%` }}
                          transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-watchman-accent to-watchman-purple rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-watchman-muted/30" />
                  <p className="text-watchman-muted">No commitments tracked</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Summary Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="glass rounded-3xl border border-white/10 p-8"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-semibold">Year Summary</h3>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-12 text-center">
              {[
                { value: stats.work_days + stats.work_nights, label: 'Total Work Days', color: 'text-watchman-accent' },
                { value: stats.off_days + stats.leave_days, label: 'Total Rest Days', color: 'text-emerald-400' },
                { value: stats.study_hours, label: 'Study Hours', suffix: 'h', color: 'text-blue-400' },
                { value: stats.commitment_count, label: 'Active Commitments', color: 'text-purple-400' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.1, type: 'spring' }}
                >
                  <p className={cn('text-4xl font-bold', item.color)}>
                    {item.value.toLocaleString()}{item.suffix}
                  </p>
                  <p className="text-sm text-watchman-muted mt-1">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Empty State */}
      {!loading && !stats && !error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-watchman-accent" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Statistics Yet</h2>
          <p className="text-watchman-muted mb-6 max-w-md mx-auto">
            Generate your calendar first to see beautiful insights about your schedule.
          </p>
          <Button variant="gradient" className="gap-2">
            <Zap className="w-4 h-4" />
            Generate Calendar
          </Button>
        </motion.div>
      )}
    </div>
  );
}
