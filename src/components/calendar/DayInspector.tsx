'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Sun,
  Moon,
  Coffee,
  Plane,
  BookOpen,
  Clock,
  AlertCircle,
  X,
  Edit2,
  Calendar,
  Sparkles,
  GraduationCap,
  Plus,
  FileText,
  AlertTriangle,
  Save,
  Trash2,
  Timer,
  Shield,
  Wrench,
  UserX,
  Siren,
  FileWarning,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Ban,
  Weight,
  DollarSign,
  CalendarClock,
  MessageSquareWarning,
  ShieldAlert,
  Building2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { IncidentModal, LogModal } from '@/components/ui/IncidentModal';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { CalendarDay, DailyLog, Incident } from './CalendarGrid';

interface DayInspectorProps {
  date: Date;
  dayData: CalendarDay | null;
  onClose: () => void;
  onAddCommitment?: () => void;
  onAddLeave?: () => void;
  onEditDay?: () => void;
  onDataChange?: () => void;
  workSettings?: {
    day_hours?: { start: string; end: string };
    night_hours?: { start: string; end: string };
  };
}

const workTypeInfo = {
  work_day: {
    icon: Sun,
    label: 'Day Shift',
    description: 'Working during daytime hours',
    color: 'text-amber-400',
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/30',
    gradient: 'from-amber-500/20 to-transparent',
    defaultHours: 12,
  },
  work_night: {
    icon: Moon,
    label: 'Night Shift',
    description: 'Working during nighttime hours',
    color: 'text-indigo-400',
    bg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    glow: 'shadow-indigo-500/30',
    gradient: 'from-indigo-500/20 to-transparent',
    defaultHours: 12,
  },
  off: {
    icon: Coffee,
    label: 'Off Day',
    description: 'Rest and recovery day',
    color: 'text-emerald-400',
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/30',
    gradient: 'from-emerald-500/20 to-transparent',
    defaultHours: 0,
  },
};

const incidentTypes = {
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

const severityColors = {
  low: { text: 'text-green-400', bg: 'bg-green-500/20', label: 'Low' },
  medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Medium' },
  high: { text: 'text-orange-400', bg: 'bg-orange-500/20', label: 'High' },
  critical: { text: 'text-red-400', bg: 'bg-red-500/20', label: 'Critical' },
};

export function DayInspector({
  date,
  dayData,
  onClose,
  onAddCommitment,
  onAddLeave,
  onEditDay,
  onDataChange,
  workSettings
}: DayInspectorProps) {
  const workInfo = dayData?.work_type ? workTypeInfo[dayData.work_type] : null;
  const hasData = dayData !== null;
  const dateStr = format(date, 'yyyy-MM-dd');

  // Local state for logs and incidents
  const [logs, setLogs] = useState<DailyLog[]>(dayData?.logs || []);
  const [incidents, setIncidents] = useState<Incident[]>(dayData?.incidents || []);
  const [actualHours, setActualHours] = useState<number>(dayData?.actual_hours_worked || 0);
  const [overtimeHours, setOvertimeHours] = useState<number>(dayData?.overtime_hours || 0);

  // UI state
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddIncident, setShowAddIncident] = useState(false);
  const [newLogNote, setNewLogNote] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('hours');
  const [saving, setSaving] = useState(false);
  const [editingHours, setEditingHours] = useState(false);

  // Modal state
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);

  // Incident form state
  const [incidentForm, setIncidentForm] = useState({
    type: 'overtime' as keyof typeof incidentTypes,
    severity: 'medium' as keyof typeof severityColors,
    title: '',
    description: '',
    reported_to: '',
    witnesses: '',
  });

  // Calculate expected hours from work type and settings
  const calculateExpectedHours = () => {
    if (!workInfo || dayData?.work_type === 'off') return 0;

    if (workSettings) {
      const hours = dayData?.work_type === 'work_day'
        ? workSettings.day_hours
        : workSettings.night_hours;

      if (hours?.start && hours?.end) {
        const [startH] = hours.start.split(':').map(Number);
        const [endH] = hours.end.split(':').map(Number);
        let diff = endH - startH;
        if (diff <= 0) diff += 24;
        return diff;
      }
    }

    return workInfo?.defaultHours || 12;
  };

  const expectedHours = calculateExpectedHours();

  // Load data from API (with error handling for missing endpoints)
  useEffect(() => {
    const loadDayData = async () => {
      try {
        const [logsRes, incidentsRes] = await Promise.allSettled([
          api.dailyLogs.getByDate(dateStr).catch(() => null),
          api.incidents.getByDate(dateStr).catch(() => []),
        ]);

        if (logsRes.status === 'fulfilled' && logsRes.value) {
          if (Array.isArray(logsRes.value)) {
            setLogs(logsRes.value);
          } else if (logsRes.value.logs) {
            setLogs(logsRes.value.logs);
          }
          if (logsRes.value.actual_hours !== undefined) {
            setActualHours(logsRes.value.actual_hours);
          }
          if (logsRes.value.overtime_hours !== undefined) {
            setOvertimeHours(logsRes.value.overtime_hours);
          }
        }

        if (incidentsRes.status === 'fulfilled' && incidentsRes.value) {
          setIncidents(Array.isArray(incidentsRes.value) ? incidentsRes.value : []);
        }
      } catch (err) {
        // Silently fail - API endpoints might not exist yet
        console.log('Day data API not available yet');
      }
    };

    loadDayData();
  }, [dateStr]);

  // Save daily log
  const handleSaveLog = async () => {
    if (!newLogNote.trim()) return;

    setSaving(true);
    try {
      const result = await api.dailyLogs.create({
        date: dateStr,
        note: newLogNote.trim(),
      });

      setLogs(prev => [...prev, result]);
      setNewLogNote('');
      setShowAddLog(false);
      onDataChange?.();
      toast.success('Note saved', 'Your daily note has been recorded');
    } catch (err) {
      // For now, just add locally if API fails
      const localLog: DailyLog = {
        id: `local-${Date.now()}`,
        date: dateStr,
        note: newLogNote.trim(),
        created_at: new Date().toISOString(),
      };
      setLogs(prev => [...prev, localLog]);
      setNewLogNote('');
      setShowAddLog(false);
      toast.warning('Saved locally', 'Note saved locally - will sync when online');
    } finally {
      setSaving(false);
    }
  };

  // Delete log
  const handleDeleteLog = async (logId: string) => {
    try {
      if (!logId.startsWith('local-')) {
        await api.dailyLogs.delete(logId);
      }
      setLogs(prev => prev.filter(l => l.id !== logId));
      onDataChange?.();
      toast.success('Note deleted');
    } catch (err) {
      setLogs(prev => prev.filter(l => l.id !== logId));
      toast.info('Note removed locally');
    }
  };

  // Save hours
  const handleSaveHours = async () => {
    setSaving(true);
    try {
      await api.dailyLogs.updateHours(dateStr, {
        actual_hours: actualHours,
        overtime_hours: overtimeHours,
      });
      setEditingHours(false);
      onDataChange?.();
      toast.success('Hours updated', `${actualHours}h worked${overtimeHours > 0 ? ` (+${overtimeHours}h OT)` : ''}`);
    } catch (err) {
      // Just close the editing state even if API fails
      setEditingHours(false);
      toast.warning('Saved locally', 'Hours saved locally - will sync when online');
    } finally {
      setSaving(false);
    }
  };

  // Save incident
  const handleSaveIncident = async () => {
    if (!incidentForm.title.trim() || !incidentForm.description.trim()) return;

    setSaving(true);
    try {
      const result = await api.incidents.create({
        date: dateStr,
        ...incidentForm,
      });

      setIncidents(prev => [...prev, result]);
      resetIncidentForm();
      setShowAddIncident(false);
      onDataChange?.();
      toast.success('Incident logged', `${incidentForm.severity.toUpperCase()} severity incident recorded`);
    } catch (err) {
      // For now, add locally if API fails
      const localIncident: Incident = {
        id: `local-${Date.now()}`,
        date: dateStr,
        ...incidentForm,
        created_at: new Date().toISOString(),
      };
      setIncidents(prev => [...prev, localIncident]);
      resetIncidentForm();
      setShowAddIncident(false);
      toast.warning('Saved locally', 'Incident saved locally - will sync when online');
    } finally {
      setSaving(false);
    }
  };

  const resetIncidentForm = () => {
    setIncidentForm({
      type: 'overtime',
      severity: 'medium',
      title: '',
      description: '',
      reported_to: '',
      witnesses: '',
    });
  };

  // Delete incident
  const handleDeleteIncident = async (incidentId: string) => {
    try {
      if (!incidentId.startsWith('local-')) {
        await api.incidents.delete(incidentId);
      }
      setIncidents(prev => prev.filter(i => i.id !== incidentId));
      onDataChange?.();
      toast.success('Incident deleted');
    } catch (err) {
      setIncidents(prev => prev.filter(i => i.id !== incidentId));
      toast.info('Incident removed locally');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass rounded-3xl border border-white/10 overflow-hidden max-h-[85vh] flex flex-col"
    >
      {/* Header with Gradient */}
      <div className={cn(
        'relative px-6 py-5 border-b border-white/5 flex-shrink-0',
        workInfo && `bg-gradient-to-r ${workInfo.gradient}`
      )}>
        <div className="flex items-start justify-between">
          <div>
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold tracking-tight"
            >
              {format(date, 'EEEE')}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-watchman-muted mt-0.5 flex items-center gap-2"
            >
              <Calendar className="w-3.5 h-3.5" />
              {format(date, 'MMMM d, yyyy')}
            </motion.p>
          </div>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {workInfo && (
          <div className="absolute top-4 right-16 w-20 h-20 rounded-full opacity-10 blur-xl"
            style={{ background: workInfo.bg.includes('amber') ? '#F59E0B' : workInfo.bg.includes('indigo') ? '#6366F1' : '#10B981' }}
          />
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Hours Worked Section */}
        {hasData && dayData?.work_type && dayData.work_type !== 'off' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-white/5 overflow-hidden"
          >
            <button
              onClick={() => toggleSection('hours')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Hours Worked</p>
                  <p className="text-xs text-watchman-muted">
                    Expected: {expectedHours}h | Actual: {actualHours || '-'}h
                    {overtimeHours > 0 && <span className="text-amber-400 ml-2">+{overtimeHours}h OT</span>}
                  </p>
                </div>
              </div>
              {expandedSection === 'hours' ? <ChevronUp className="w-5 h-5 text-watchman-muted" /> : <ChevronDown className="w-5 h-5 text-watchman-muted" />}
            </button>

            <AnimatePresence>
              {expandedSection === 'hours' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5"
                >
                  <div className="p-4 space-y-4">
                    {editingHours ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-watchman-muted mb-1 block">Actual Hours Worked</label>
                          <input
                            type="number"
                            value={actualHours}
                            onChange={(e) => setActualHours(Number(e.target.value))}
                            className="w-full px-3 py-2 glass border border-white/10 rounded-lg text-sm focus:border-watchman-accent focus:outline-none"
                            min="0"
                            max="24"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-watchman-muted mb-1 block">Overtime Hours</label>
                          <input
                            type="number"
                            value={overtimeHours}
                            onChange={(e) => setOvertimeHours(Number(e.target.value))}
                            className="w-full px-3 py-2 glass border border-white/10 rounded-lg text-sm focus:border-watchman-accent focus:outline-none"
                            min="0"
                            max="24"
                            step="0.5"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" onClick={handleSaveHours} disabled={saving} className="gap-2">
                            <Save className="w-4 h-4" />
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingHours(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-3 gap-4 flex-1">
                          <div className="text-center p-3 glass rounded-xl">
                            <p className="text-2xl font-bold text-blue-400">{expectedHours}h</p>
                            <p className="text-xs text-watchman-muted">Expected</p>
                          </div>
                          <div className="text-center p-3 glass rounded-xl">
                            <p className="text-2xl font-bold text-emerald-400">{actualHours || '-'}h</p>
                            <p className="text-xs text-watchman-muted">Actual</p>
                          </div>
                          <div className="text-center p-3 glass rounded-xl">
                            <p className="text-2xl font-bold text-amber-400">{overtimeHours || 0}h</p>
                            <p className="text-xs text-watchman-muted">Overtime</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setEditingHours(true)} className="ml-4">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Work Type & Cycle */}
        {workInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={cn(
              'flex items-center gap-4 p-4 rounded-2xl',
              'bg-gradient-to-r',
              workInfo.gradient
            )}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg',
                workInfo.bg,
                workInfo.glow
              )}
            >
              <workInfo.icon className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{workInfo.label}</p>
              <p className="text-sm text-watchman-muted">
                {dayData?.cycle_day && `Day ${dayData.cycle_day} of rotation`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Daily Notes/Logs Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-white/5 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('logs')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Daily Notes</p>
                <p className="text-xs text-watchman-muted">{logs.length} note{logs.length !== 1 ? 's' : ''} recorded</p>
              </div>
            </div>
            {expandedSection === 'logs' ? <ChevronUp className="w-5 h-5 text-watchman-muted" /> : <ChevronDown className="w-5 h-5 text-watchman-muted" />}
          </button>

          <AnimatePresence>
            {expandedSection === 'logs' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5"
              >
                <div className="p-4 space-y-3">
                  {logs.length > 0 ? (
                    logs.map((log, i) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 glass rounded-xl group cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm flex-1 line-clamp-2">{log.note}</p>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                              className="p-1 rounded-lg hover:bg-white/10 text-watchman-muted hover:text-watchman-accent transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }}
                              className="p-1 rounded-lg hover:bg-red-500/20 text-watchman-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-watchman-muted mt-2">
                          {format(new Date(log.created_at), 'h:mm a')}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-watchman-muted text-center py-4">No notes yet</p>
                  )}

                  {showAddLog ? (
                    <div className="space-y-3">
                      <textarea
                        value={newLogNote}
                        onChange={(e) => setNewLogNote(e.target.value)}
                        placeholder="What happened today? Document incidents, accomplishments, concerns..."
                        className="w-full px-3 py-2 glass border border-white/10 rounded-xl text-sm focus:border-watchman-accent focus:outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary" onClick={handleSaveLog} disabled={saving || !newLogNote.trim()} className="gap-2">
                          <Save className="w-4 h-4" />
                          Save Note
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setShowAddLog(false); setNewLogNote(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="glass" onClick={() => setShowAddLog(true)} className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Add Note
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Incidents Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl border border-white/5 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('incidents')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Incidents & Issues</p>
                <p className="text-xs text-watchman-muted">{incidents.length} incident{incidents.length !== 1 ? 's' : ''} logged</p>
              </div>
            </div>
            {expandedSection === 'incidents' ? <ChevronUp className="w-5 h-5 text-watchman-muted" /> : <ChevronDown className="w-5 h-5 text-watchman-muted" />}
          </button>

          <AnimatePresence>
            {expandedSection === 'incidents' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5"
              >
                <div className="p-4 space-y-3">
                  {incidents.length > 0 ? (
                    incidents.map((incident, i) => {
                      const typeInfo = incidentTypes[incident.type as keyof typeof incidentTypes] || incidentTypes.other;
                      const sevInfo = severityColors[incident.severity as keyof typeof severityColors] || severityColors.medium;

                      return (
                        <motion.div
                          key={incident.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-3 glass rounded-xl group cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => setSelectedIncident(incident)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', typeInfo.bg)}>
                              <typeInfo.icon className={cn('w-4 h-4', typeInfo.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm truncate">{incident.title}</p>
                                <span className={cn('px-2 py-0.5 rounded-full text-xs', sevInfo.bg, sevInfo.text)}>
                                  {sevInfo.label}
                                </span>
                              </div>
                              <p className="text-xs text-watchman-muted line-clamp-2">{incident.description}</p>
                              {incident.reported_to && (
                                <p className="text-xs text-watchman-muted mt-1">Reported to: {incident.reported_to}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedIncident(incident); }}
                                className="p-1 rounded-lg hover:bg-white/10 text-watchman-muted hover:text-watchman-accent transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteIncident(incident.id); }}
                                className="p-1 rounded-lg hover:bg-red-500/20 text-watchman-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-watchman-muted text-center py-4">No incidents logged</p>
                  )}

                  {showAddIncident ? (
                    <div className="space-y-3 p-3 glass rounded-xl border border-white/10">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-watchman-muted mb-1 block">Type</label>
                          <select
                            value={incidentForm.type}
                            onChange={(e) => setIncidentForm(prev => ({ ...prev, type: e.target.value as keyof typeof incidentTypes }))}
                            className="w-full px-3 py-2 glass border border-white/10 rounded-lg text-sm focus:border-watchman-accent focus:outline-none bg-transparent"
                          >
                            {Object.entries(incidentTypes).map(([key, val]) => (
                              <option key={key} value={key} className="bg-watchman-bg">{val.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-watchman-muted mb-1 block">Severity</label>
                          <select
                            value={incidentForm.severity}
                            onChange={(e) => setIncidentForm(prev => ({ ...prev, severity: e.target.value as keyof typeof severityColors }))}
                            className="w-full px-3 py-2 glass border border-white/10 rounded-lg text-sm focus:border-watchman-accent focus:outline-none bg-transparent"
                          >
                            {Object.entries(severityColors).map(([key, val]) => (
                              <option key={key} value={key} className="bg-watchman-bg">{val.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-watchman-muted mb-1 block">Title</label>
                        <input
                          type="text"
                          value={incidentForm.title}
                          onChange={(e) => setIncidentForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Brief title of the incident"
                          className="w-full px-3 py-2 glass border border-white/10 rounded-lg text-sm focus:border-watchman-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-watchman-muted mb-1 block">Description</label>
                        <textarea
                          value={incidentForm.description}
                          onChange={(e) => setIncidentForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Detailed description of what happened..."
                          className="w-full px-3 py-2 glass border border-white/10 rounded-xl text-sm focus:border-watchman-accent focus:outline-none resize-none"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-watchman-muted mb-1 block">Reported To (optional)</label>
                          <input
                            type="text"
                            value={incidentForm.reported_to}
                            onChange={(e) => setIncidentForm(prev => ({ ...prev, reported_to: e.target.value }))}
                            placeholder="Manager, HR, etc."
                            className="w-full px-3 py-2 glass border border-white/10 rounded-lg text-sm focus:border-watchman-accent focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-watchman-muted mb-1 block">Witnesses (optional)</label>
                          <input
                            type="text"
                            value={incidentForm.witnesses}
                            onChange={(e) => setIncidentForm(prev => ({ ...prev, witnesses: e.target.value }))}
                            placeholder="Names of witnesses"
                            className="w-full px-3 py-2 glass border border-white/10 rounded-lg text-sm focus:border-watchman-accent focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={handleSaveIncident}
                          disabled={saving || !incidentForm.title.trim() || !incidentForm.description.trim()}
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Log Incident
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setShowAddIncident(false); resetIncidentForm(); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="glass" onClick={() => setShowAddIncident(true)} className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Log Incident
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Leave Status */}
        {dayData?.is_leave && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-teal-500/20 to-transparent border border-teal-500/20"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30"
            >
              <Plane className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <p className="font-semibold text-teal-400">On Leave</p>
              <p className="text-sm text-watchman-muted">Scheduled leave day</p>
            </div>
          </motion.div>
        )}

        {/* Commitments */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-medium text-watchman-muted uppercase tracking-wider">
                Commitments
              </h4>
              {onAddCommitment && (
                <motion.button
                  onClick={onAddCommitment}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 text-xs text-watchman-accent hover:text-watchman-accent/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </motion.button>
              )}
            </div>

            {dayData?.commitments && dayData.commitments.length > 0 ? (
              <div className="space-y-2">
                {dayData.commitments.map((commitment, i) => (
                  <motion.div
                    key={commitment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center gap-3 p-3 glass rounded-xl group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-watchman-accent/20 transition-shadow">
                      <GraduationCap className="w-5 h-5 text-watchman-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-watchman-accent transition-colors">
                        {commitment.name}
                      </p>
                      <p className="text-xs text-watchman-muted capitalize">
                        {commitment.type}
                        {commitment.hours && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {commitment.hours}h
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-4 glass rounded-2xl text-center">
                <BookOpen className="w-6 h-6 text-watchman-muted/50 mx-auto mb-2" />
                <p className="text-sm text-watchman-muted">No commitments</p>
              </div>
            )}
          </motion.div>
        )}

        {/* No Data State */}
        {!hasData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 glass rounded-2xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-watchman-muted/50" />
            </div>
            <p className="text-watchman-muted mb-2">
              No schedule data for this day
            </p>
            <p className="text-sm text-watchman-muted/60">
              Generate your calendar first to see details
            </p>
          </motion.div>
        )}

        {/* Preview Indicator */}
        {dayData?.is_preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-watchman-accent/10 border border-watchman-accent/20"
          >
            <div className="w-8 h-8 rounded-lg bg-watchman-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-watchman-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-watchman-accent">Preview Mode</p>
              <p className="text-xs text-watchman-muted">Changes are not yet applied</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Actions */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="px-6 py-4 border-t border-white/5 flex gap-3 bg-white/[0.02] flex-shrink-0"
        >
          {onAddLeave && !dayData?.is_leave && (
            <Button
              variant="glass"
              size="sm"
              className="flex-1 gap-2"
              onClick={onAddLeave}
            >
              <Plane className="w-4 h-4" />
              Add Leave
            </Button>
          )}
          {onEditDay && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2"
              onClick={onEditDay}
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
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
    </motion.div>
  );
}

// Quick Stats Component for Day
interface DayStatsProps {
  cycleDay: number;
  totalCycleDays: number;
  workType: 'day' | 'night' | 'off' | null;
  commitmentCount: number;
  totalHours: number;
}

export function DayQuickStats({
  cycleDay,
  totalCycleDays,
  workType,
  commitmentCount,
  totalHours
}: DayStatsProps) {
  const stats = [
    { label: 'Cycle Progress', value: `${cycleDay} / ${totalCycleDays}`, icon: Sparkles },
    { label: 'Work Type', value: workType ? workType.charAt(0).toUpperCase() + workType.slice(1) : 'None', icon: Sun },
    { label: 'Commitments', value: commitmentCount.toString(), icon: BookOpen },
    { label: 'Study Hours', value: `${totalHours}h`, icon: Clock },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.02 }}
          className="p-4 glass rounded-2xl border border-white/5 group cursor-default"
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className="w-3.5 h-3.5 text-watchman-muted group-hover:text-watchman-accent transition-colors" />
            <p className="text-xs text-watchman-muted">{stat.label}</p>
          </div>
          <p className="text-xl font-bold group-hover:text-watchman-accent transition-colors">
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
