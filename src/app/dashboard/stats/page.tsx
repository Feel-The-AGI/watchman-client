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
  Download,
  FileSpreadsheet,
  Shield,
  X,
  Eye,
  Timer,
  Wrench,
  UserX,
  Siren,
  FileWarning,
  MoreHorizontal,
  HeartPulse,
  Ban,
  Weight,
  DollarSign,
  CalendarClock,
  MessageSquareWarning,
  ShieldAlert,
  Building2,
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
import { toast } from '@/components/ui/Toast';
import { IncidentModal, LogModal } from '@/components/ui/IncidentModal';
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

interface WorkSettings {
  day_hours: { start: string; end: string };
  night_hours: { start: string; end: string };
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

interface IncidentStats {
  total_count: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_month: Record<string, number>;
}

interface Incident {
  id: string;
  date: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  reported_to?: string;
  witnesses?: string;
  outcome?: string;
  created_at: string;
}

interface DailyLog {
  id: string;
  date: string;
  note: string;
  actual_hours?: number;
  overtime_hours?: number;
  created_at: string;
}

const incidentTypeIcons: Record<string, { icon: typeof Timer; label: string; color: string; bg: string }> = {
  overtime: { icon: Timer, label: 'Overtime', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  safety: { icon: Shield, label: 'Safety Issue', color: 'text-red-400', bg: 'bg-red-500/20' },
  equipment: { icon: Wrench, label: 'Equipment Failure', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  harassment: { icon: UserX, label: 'Harassment', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  injury: { icon: Siren, label: 'Injury', color: 'text-red-500', bg: 'bg-red-600/20' },
  policy_violation: { icon: FileWarning, label: 'Policy Violation', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  health: { icon: HeartPulse, label: 'Health / Sick', color: 'text-pink-400', bg: 'bg-pink-500/20' },
  discrimination: { icon: Ban, label: 'Discrimination', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20' },
  workload: { icon: Weight, label: 'Excessive Workload', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  compensation: { icon: DollarSign, label: 'Pay / Compensation', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  scheduling: { icon: CalendarClock, label: 'Scheduling Issue', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  communication: { icon: MessageSquareWarning, label: 'Communication Issue', color: 'text-sky-400', bg: 'bg-sky-500/20' },
  retaliation: { icon: ShieldAlert, label: 'Retaliation', color: 'text-rose-400', bg: 'bg-rose-500/20' },
  environment: { icon: Building2, label: 'Work Environment', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  other: { icon: MoreHorizontal, label: 'Other', color: 'text-gray-400', bg: 'bg-gray-500/20' },
};

const severityStyleColors: Record<string, { text: string; bg: string; label: string }> = {
  low: { text: 'text-green-400', bg: 'bg-green-500/20', label: 'Low' },
  medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Medium' },
  high: { text: 'text-orange-400', bg: 'bg-orange-500/20', label: 'High' },
  critical: { text: 'text-red-400', bg: 'bg-red-500/20', label: 'Critical' },
};

const COLORS = {
  work_day: '#F59E0B',
  work_night: '#6366F1',
  off: '#10B981',
  leave: '#14B8A6',
  study: '#3B82F6',
  accent: '#3B82F6',
};

// Calculate hours between two time strings (e.g., "06:00" to "18:00")
const calculateShiftHours = (start?: string, end?: string): number => {
  if (!start || !end) return 12; // Default to 12 hours
  try {
    const [startH] = start.split(':').map(Number);
    const [endH] = end.split(':').map(Number);
    let hours = endH - startH;
    if (hours <= 0) hours += 24; // Handle overnight shifts
    return hours;
  } catch {
    return 12; // Default fallback
  }
};

// Safe date formatter that handles invalid dates
const safeFormatDate = (dateStr: string | undefined, formatStr: string, fallback = 'N/A'): string => {
  if (!dateStr) return fallback;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return fallback;
    return format(date, formatStr);
  } catch {
    return fallback;
  }
};

export default function StatsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<YearStats | null>(null);
  const [workSettings, setWorkSettings] = useState<WorkSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'stats' | 'logs' | 'incidents' | 'all'>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportProgress, setExportProgress] = useState('');
  const [incidentStats, setIncidentStats] = useState<IncidentStats | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);

  useEffect(() => {
    fetchStats();
    fetchIncidentStats();
    fetchRecentData();
  }, [year]);

  const fetchIncidentStats = async () => {
    try {
      const stats = await api.incidents.getStats(year);
      setIncidentStats(stats);
    } catch (err) {
      // Incidents stats not critical - just log it
      console.log('Incident stats not available yet');
    }
  };

  const fetchRecentData = async () => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    try {
      // Fetch recent incidents
      const incidents = await api.incidents.list(startDate, endDate);
      setRecentIncidents(Array.isArray(incidents) ? incidents.slice(0, 10) : []);
    } catch (err) {
      console.log('Could not fetch recent incidents');
    }

    try {
      // Fetch recent logs
      const logs = await api.dailyLogs.getRange(startDate, endDate);
      const logsArray = Array.isArray(logs) ? logs : (logs?.logs || []);
      setRecentLogs(logsArray.slice(0, 10));
    } catch (err) {
      console.log('Could not fetch recent logs');
    }
  };

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

      // Fetch stats and work settings in parallel
      const [statsResponse, settingsResponse] = await Promise.all([
        api.stats.getDetailed(year),
        api.masterSettings.get().catch(() => null),
      ]);

      // Handle work settings - deep merge with defaults
      const work = settingsResponse?.settings?.work || {};
      setWorkSettings({
        day_hours: {
          start: work.day_hours?.start || '06:00',
          end: work.day_hours?.end || '18:00',
        },
        night_hours: {
          start: work.night_hours?.start || '18:00',
          end: work.night_hours?.end || '06:00',
        },
      });

      if (statsResponse) {
        // Map API response keys (API uses total_work_days, etc.) to our interface
        setStats({
          year: statsResponse.year || year,
          total_days: statsResponse.total_days || 0,
          work_days: statsResponse.total_work_days ?? statsResponse.work_days ?? 0,
          work_nights: statsResponse.total_work_nights ?? statsResponse.work_nights ?? 0,
          off_days: statsResponse.total_off_days ?? statsResponse.off_days ?? 0,
          leave_days: statsResponse.total_leave_days ?? statsResponse.leave_days ?? 0,
          study_hours: statsResponse.total_study_hours ?? statsResponse.study_hours ?? 0,
          commitment_count: statsResponse.commitment_count || 0,
          monthly_breakdown: statsResponse.monthly_breakdown || [],
          peak_weeks: (statsResponse.peak_weeks || []).map((week: any) => {
            // peak_weeks can be strings (week keys) or objects
            if (typeof week === 'string') {
              return {
                week_start: week,
                week_end: week,
                total_hours: 0,
                is_overloaded: false
              };
            }
            return week;
          }),
          commitment_breakdown: statsResponse.commitment_breakdown || [],
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

  const handleComprehensiveExport = async () => {
    try {
      setExporting(true);
      setExportProgress('');

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      const downloads: { name: string; blob: Blob }[] = [];

      if (exportType === 'stats' || exportType === 'all') {
        setExportProgress('Exporting statistics...');
        try {
          const statsBlob = await api.stats.export(year, exportFormat);
          downloads.push({ name: `watchman-stats-${year}.${exportFormat}`, blob: statsBlob });
        } catch (e) {
          console.log('Stats export not available');
        }
      }

      if (exportType === 'logs' || exportType === 'all') {
        setExportProgress('Exporting daily logs...');
        try {
          const logsBlob = await api.dailyLogs.export(startDate, endDate, exportFormat);
          downloads.push({ name: `watchman-daily-logs-${year}.${exportFormat}`, blob: logsBlob });
        } catch (e) {
          console.log('Logs export not available');
        }
      }

      if (exportType === 'incidents' || exportType === 'all') {
        setExportProgress('Exporting incidents...');
        try {
          const incidentsBlob = await api.incidents.export(startDate, endDate, exportFormat);
          downloads.push({ name: `watchman-incidents-${year}.${exportFormat}`, blob: incidentsBlob });
        } catch (e) {
          console.log('Incidents export not available');
        }
      }

      // Download all files
      setExportProgress('Downloading files...');
      for (const file of downloads) {
        const url = window.URL.createObjectURL(file.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (downloads.length === 0) {
        toast.error('Export failed', 'No data available to export. Run database migrations first.');
      } else {
        setShowExportModal(false);
        toast.success('Export complete', `${downloads.length} file(s) downloaded`);
      }
    } catch (err: any) {
      toast.error('Export failed', err.message || 'Failed to export data');
    } finally {
      setExporting(false);
      setExportProgress('');
    }
  };

  // Calculate total work hours
  const totalWorkHours = useMemo(() => {
    if (!stats || !workSettings) return 0;
    const dayShiftHours = calculateShiftHours(workSettings?.day_hours?.start, workSettings?.day_hours?.end);
    const nightShiftHours = calculateShiftHours(workSettings?.night_hours?.start, workSettings?.night_hours?.end);
    return (stats.work_days * dayShiftHours) + (stats.work_nights * nightShiftHours);
  }, [stats, workSettings]);

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
      month: safeFormatDate(m.month, 'MMM', 'N/A'),
      'Day Shifts': m.work_days || 0,
      'Night Shifts': m.work_nights || 0,
      'Off Days': m.off_days || 0,
      'Study Hours': m.study_hours || 0,
    }));
  }, [stats]);

  const studyHoursData = useMemo(() => {
    if (!stats?.monthly_breakdown) return [];
    return stats.monthly_breakdown.map(m => ({
      month: safeFormatDate(m.month, 'MMM', 'N/A'),
      hours: m.study_hours || 0,
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export All
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !exporting && setShowExportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass rounded-3xl border border-white/10 p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center shadow-lg shadow-watchman-accent/30">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Export Your Data</h2>
                    <p className="text-sm text-watchman-muted">Download logs, incidents, and stats</p>
                  </div>
                </div>
                <button
                  onClick={() => !exporting && setShowExportModal(false)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  disabled={exporting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Export Type Selection */}
              <div className="space-y-3 mb-6">
                <label className="text-sm font-medium text-watchman-muted">What to export</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all', label: 'Everything', icon: FileSpreadsheet, desc: 'All data' },
                    { value: 'stats', label: 'Statistics', icon: BarChart3, desc: 'Schedule summary' },
                    { value: 'logs', label: 'Daily Logs', icon: FileText, desc: 'Notes & hours' },
                    { value: 'incidents', label: 'Incidents', icon: Shield, desc: 'Issues & reports' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setExportType(option.value as typeof exportType)}
                      className={cn(
                        'p-3 rounded-xl border transition-all text-left',
                        exportType === option.value
                          ? 'border-watchman-accent bg-watchman-accent/10'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <option.icon className={cn(
                          'w-4 h-4',
                          exportType === option.value ? 'text-watchman-accent' : 'text-watchman-muted'
                        )} />
                        <span className="font-medium text-sm">{option.label}</span>
                      </div>
                      <p className="text-xs text-watchman-muted">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-3 mb-6">
                <label className="text-sm font-medium text-watchman-muted">File format</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={cn(
                      'flex-1 p-4 rounded-xl border transition-all',
                      exportFormat === 'csv'
                        ? 'border-watchman-accent bg-watchman-accent/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    )}
                  >
                    <Table className={cn(
                      'w-6 h-6 mx-auto mb-2',
                      exportFormat === 'csv' ? 'text-watchman-accent' : 'text-watchman-muted'
                    )} />
                    <p className="font-medium text-sm">CSV / Excel</p>
                    <p className="text-xs text-watchman-muted">Spreadsheet format</p>
                  </button>
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={cn(
                      'flex-1 p-4 rounded-xl border transition-all',
                      exportFormat === 'pdf'
                        ? 'border-watchman-accent bg-watchman-accent/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    )}
                  >
                    <FileText className={cn(
                      'w-6 h-6 mx-auto mb-2',
                      exportFormat === 'pdf' ? 'text-watchman-accent' : 'text-watchman-muted'
                    )} />
                    <p className="font-medium text-sm">PDF</p>
                    <p className="text-xs text-watchman-muted">Document format</p>
                  </button>
                </div>
              </div>

              {/* Year Info */}
              <div className="p-3 glass rounded-xl mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-watchman-muted" />
                  <span className="text-watchman-muted">Exporting data for</span>
                  <span className="font-bold text-watchman-accent">{year}</span>
                </div>
              </div>

              {/* Export Button */}
              <Button
                variant="gradient"
                size="lg"
                className="w-full gap-2"
                onClick={handleComprehensiveExport}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {exportProgress || 'Exporting...'}
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Export {exportType === 'all' ? 'All Data' : exportType.charAt(0).toUpperCase() + exportType.slice(1)}
                  </>
                )}
              </Button>

              {/* Info note */}
              <p className="text-xs text-watchman-muted text-center mt-4">
                Your data is private and secure. Export to keep records for documentation or dispute resolution.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { icon: Calendar, label: 'Total Days', value: stats.total_days, color: 'from-watchman-accent to-watchman-purple', glow: 'shadow-watchman-accent/30' },
              { icon: Clock, label: 'Work Hours', value: totalWorkHours, suffix: 'h', color: 'from-rose-500 to-pink-600', glow: 'shadow-rose-500/30' },
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
                            {safeFormatDate(week.week_start, 'MMM d')} - {safeFormatDate(week.week_end, 'MMM d')}
                          </p>
                          {week.is_overloaded && (
                            <p className="text-xs text-red-400">High workload</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{week.total_hours ?? 0}h</p>
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
                      key={commitment.id || `commitment-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className="glass rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{commitment.name || 'Unnamed'}</p>
                          <p className="text-xs text-watchman-muted capitalize">{commitment.type || 'other'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-watchman-accent">{commitment.total_hours ?? 0}h</p>
                          <p className="text-xs text-watchman-muted">{commitment.sessions_count ?? 0} sessions</p>
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(((commitment.total_hours || 0) / (stats.study_hours || 1)) * 100, 100)}%` }}
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

          {/* Incident Stats Section */}
          {incidentStats && incidentStats.total_count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="glass rounded-3xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Incidents Logged</h3>
                  <p className="text-sm text-watchman-muted">Workplace issues documented this year</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-red-400">{incidentStats.total_count}</p>
                  <p className="text-xs text-watchman-muted">Total incidents</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* By Severity */}
                {Object.entries(incidentStats.by_severity).map(([severity, count]) => {
                  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
                    critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
                    high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
                    medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
                    low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
                  };
                  const colors = severityColors[severity] || severityColors.medium;
                  return (
                    <div
                      key={severity}
                      className={cn('p-4 rounded-xl border', colors.bg, colors.border)}
                    >
                      <p className={cn('text-2xl font-bold', colors.text)}>{count}</p>
                      <p className="text-xs text-watchman-muted capitalize">{severity} severity</p>
                    </div>
                  );
                })}
              </div>

              {/* By Type - show if there are multiple types */}
              {Object.keys(incidentStats.by_type).length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <p className="text-sm font-medium text-watchman-muted mb-3">By Category</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(incidentStats.by_type).map(([type, count]) => {
                      const typeLabels: Record<string, string> = {
                        overtime: 'Overtime',
                        safety: 'Safety',
                        equipment: 'Equipment',
                        harassment: 'Harassment',
                        injury: 'Injury',
                        policy_violation: 'Policy Violation',
                        other: 'Other',
                      };
                      return (
                        <div
                          key={type}
                          className="px-3 py-1.5 rounded-full glass border border-white/10 text-sm"
                        >
                          <span className="text-watchman-muted">{typeLabels[type] || type}:</span>
                          <span className="ml-1 font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Recent Incidents & Logs Grid */}
          {(recentIncidents.length > 0 || recentLogs.length > 0) && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Incidents */}
              {recentIncidents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="glass rounded-3xl border border-white/10 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold">Recent Incidents</h3>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {recentIncidents.map((incident, i) => {
                      const typeInfo = incidentTypeIcons[incident.type] || incidentTypeIcons.other;
                      const sevInfo = severityStyleColors[incident.severity] || severityStyleColors.medium;
                      const TypeIcon = typeInfo.icon;

                      return (
                        <motion.div
                          key={incident.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.85 + i * 0.05 }}
                          whileHover={{ scale: 1.01, x: 4 }}
                          onClick={() => setSelectedIncident(incident)}
                          className="p-4 glass rounded-2xl cursor-pointer hover:bg-white/5 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', typeInfo.bg)}>
                              <TypeIcon className={cn('w-5 h-5', typeInfo.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">{incident.title}</p>
                                <span className={cn('px-2 py-0.5 rounded-full text-xs flex-shrink-0', sevInfo.bg, sevInfo.text)}>
                                  {sevInfo.label}
                                </span>
                              </div>
                              <p className="text-xs text-watchman-muted line-clamp-1">{incident.description}</p>
                              <p className="text-xs text-watchman-muted mt-1">
                                {safeFormatDate(incident.date, 'MMM d, yyyy')}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedIncident(incident); }}
                              className="p-2 rounded-lg hover:bg-white/10 text-watchman-muted hover:text-watchman-accent transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Recent Logs */}
              {recentLogs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 }}
                  className="glass rounded-3xl border border-white/10 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold">Recent Daily Notes</h3>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {recentLogs.map((log, i) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + i * 0.05 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        onClick={() => setSelectedLog(log)}
                        className="p-4 glass rounded-2xl cursor-pointer hover:bg-white/5 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">{log.note}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-watchman-muted">
                              <span>{safeFormatDate(log.date, 'MMM d, yyyy')}</span>
                              {log.actual_hours && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {log.actual_hours}h worked
                                </span>
                              )}
                              {log.overtime_hours && log.overtime_hours > 0 && (
                                <span className="text-amber-400">+{log.overtime_hours}h OT</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                            className="p-2 rounded-lg hover:bg-white/10 text-watchman-muted hover:text-watchman-accent transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Export & Documentation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass rounded-3xl border border-white/10 p-6 bg-gradient-to-r from-watchman-accent/5 to-watchman-purple/5"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center shadow-lg shadow-watchman-accent/30">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Document Your Work Life</h3>
                  <p className="text-sm text-watchman-muted max-w-md">
                    Track daily logs, record incidents, and export everything.
                    Keep records for performance reviews, dispute resolution, or personal documentation.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="glass"
                  size="lg"
                  onClick={() => {
                    setExportType('incidents');
                    setShowExportModal(true);
                  }}
                  className="gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Export Incidents
                </Button>
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={() => {
                    setExportType('all');
                    setShowExportModal(true);
                  }}
                  className="gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export All Data
                </Button>
              </div>
            </div>
          </motion.div>

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
                { value: totalWorkHours, label: 'Total Work Hours', suffix: 'h', color: 'text-rose-400' },
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

      {/* Modals */}
      <IncidentModal
        incident={selectedIncident}
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />
      <LogModal
        log={selectedLog}
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
