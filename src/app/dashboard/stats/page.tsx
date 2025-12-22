'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
  work_day: '#4A90D9',
  work_night: '#5C6BC0',
  off: '#66BB6A',
  leave: '#1DE9B6',
  study: '#2979FF',
};

export default function StatsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<YearStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [year]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.stats.getDetailed(year);
      setStats(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      const blob = await api.stats.export(year, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watchman-stats-${year}.${format}`;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Statistics</h1>
          <p className="text-watchman-muted">
            Detailed breakdown of your schedule
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Year Selector */}
          <div className="flex items-center bg-watchman-surface rounded-xl border border-white/5">
            <button
              onClick={() => setYear(y => y - 1)}
              className="p-2 hover:bg-white/5 rounded-l-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-medium">{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              className="p-2 hover:bg-white/5 rounded-r-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={exporting || !stats}
              className="gap-2"
            >
              <Table className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('pdf')}
              disabled={exporting || !stats}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-watchman-error/10 border border-watchman-error/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-watchman-error flex-shrink-0" />
          <p className="text-sm text-watchman-error">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchStats} className="ml-auto gap-2">
            <RefreshCw className="w-4 h-4" />
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

      {/* Stats Content */}
      {!loading && stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Total Days"
              value={stats.total_days}
              color="bg-watchman-accent"
            />
            <StatCard
              icon={<Sun className="w-5 h-5" />}
              label="Day Shifts"
              value={stats.work_days}
              color="bg-work-day"
            />
            <StatCard
              icon={<Moon className="w-5 h-5" />}
              label="Night Shifts"
              value={stats.work_nights}
              color="bg-work-night"
            />
            <StatCard
              icon={<Coffee className="w-5 h-5" />}
              label="Off Days"
              value={stats.off_days}
              color="bg-work-off"
            />
            <StatCard
              icon={<Plane className="w-5 h-5" />}
              label="Leave Days"
              value={stats.leave_days}
              color="bg-watchman-mint"
            />
            <StatCard
              icon={<BookOpen className="w-5 h-5" />}
              label="Study Hours"
              value={stats.study_hours}
              suffix="h"
              color="bg-watchman-accent"
            />
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Day Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1A1B1E',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Study Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Study Hours by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studyHoursData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280' }}
                      />
                      <YAxis 
                        stroke="#6B7280"
                        tick={{ fill: '#6B7280' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1A1B1E',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        stroke={COLORS.study}
                        strokeWidth={2}
                        dot={{ fill: COLORS.study }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6B7280"
                      tick={{ fill: '#6B7280' }}
                    />
                    <YAxis 
                      stroke="#6B7280"
                      tick={{ fill: '#6B7280' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1B1E',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Day Shifts" fill={COLORS.work_day} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Night Shifts" fill={COLORS.work_night} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Off Days" fill={COLORS.off} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Additional Stats */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Peak Weeks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-watchman-error" />
                  Peak Weeks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.peak_weeks && stats.peak_weeks.length > 0 ? (
                  <div className="space-y-3">
                    {stats.peak_weeks.slice(0, 5).map((week, index) => (
                      <div
                        key={index}
                        className={cn(
                          'p-4 rounded-xl flex items-center justify-between',
                          week.is_overloaded
                            ? 'bg-watchman-error/10 border border-watchman-error/20'
                            : 'bg-watchman-bg'
                        )}
                      >
                        <div>
                          <p className="font-medium">
                            {format(new Date(week.week_start), 'MMM d')} - {format(new Date(week.week_end), 'MMM d')}
                          </p>
                          <p className="text-sm text-watchman-muted">
                            {week.is_overloaded && (
                              <span className="text-watchman-error mr-2">⚠️ High Load</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{week.total_hours}h</p>
                          <p className="text-xs text-watchman-muted">study</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-watchman-muted text-center py-8">
                    No peak weeks data available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Commitment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-watchman-accent" />
                  Commitments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.commitment_breakdown && stats.commitment_breakdown.length > 0 ? (
                  <div className="space-y-3">
                    {stats.commitment_breakdown.map((commitment) => (
                      <div
                        key={commitment.id}
                        className="p-4 bg-watchman-bg rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{commitment.name}</p>
                            <p className="text-xs text-watchman-muted capitalize">
                              {commitment.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{commitment.total_hours}h</p>
                            <p className="text-xs text-watchman-muted">
                              {commitment.sessions_count} sessions
                            </p>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-watchman-accent rounded-full"
                            style={{
                              width: `${Math.min((commitment.total_hours / (stats.study_hours || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-watchman-muted text-center py-8">
                    No commitments tracked yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Footer */}
          <Card>
            <CardContent className="py-6">
              <div className="flex flex-wrap items-center justify-center gap-8 text-center">
                <div>
                  <p className="text-3xl font-bold text-watchman-accent">{stats.work_days + stats.work_nights}</p>
                  <p className="text-sm text-watchman-muted">Total Work Days</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-work-off">{stats.off_days + stats.leave_days}</p>
                  <p className="text-sm text-watchman-muted">Total Rest Days</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-watchman-mint">{stats.study_hours}</p>
                  <p className="text-sm text-watchman-muted">Study Hours</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <p className="text-3xl font-bold">{stats.commitment_count}</p>
                  <p className="text-sm text-watchman-muted">Active Commitments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!loading && !stats && !error && (
        <div className="text-center py-20">
          <BarChart3 className="w-16 h-16 mx-auto mb-6 text-watchman-muted opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No Statistics Yet</h2>
          <p className="text-watchman-muted mb-6">
            Generate your calendar first to see statistics.
          </p>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}

function StatCard({ icon, label, value, suffix, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-watchman-surface rounded-xl border border-white/5"
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white', color)}>
        {icon}
      </div>
      <p className="text-2xl font-bold">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-watchman-muted">{label}</p>
    </motion.div>
  );
}
