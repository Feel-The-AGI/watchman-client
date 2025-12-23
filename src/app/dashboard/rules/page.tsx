'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Settings,
  Clock,
  Sun,
  Moon,
  Coffee,
  Shield,
  BookOpen,
  Plane,
  RefreshCw,
  Loader2,
  AlertCircle,
  Check,
  Edit2,
  Plus,
  Save,
  X,
  Sparkles,
  Zap,
  Target,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MasterSettings {
  cycle: {
    pattern: { label: 'work_day' | 'work_night' | 'off'; duration: number }[];
    anchor_date: string | null;
    anchor_cycle_day: number;
  };
  work: {
    day_hours: { start: string; end: string };
    night_hours: { start: string; end: string };
    available_hours_on_off: number;
    available_hours_on_work: number;
  };
  constraints: {
    id: string;
    name: string;
    type: 'binary' | 'weighted';
    rule: string;
    weight?: number;
    is_active: boolean;
  }[];
  commitments: {
    id: string;
    name: string;
    type: string;
    start_date?: string;
    end_date?: string;
  }[];
  leave_blocks: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  }[];
}

const defaultSettings: MasterSettings = {
  cycle: {
    pattern: [
      { label: 'work_day', duration: 5 },
      { label: 'work_night', duration: 5 },
      { label: 'off', duration: 10 },
    ],
    anchor_date: null,
    anchor_cycle_day: 1,
  },
  work: {
    day_hours: { start: '06:00', end: '18:00' },
    night_hours: { start: '18:00', end: '06:00' },
    available_hours_on_off: 12,
    available_hours_on_work: 2,
  },
  constraints: [],
  commitments: [],
  leave_blocks: [],
};

export default function MasterSettingsPage() {
  const [settings, setSettings] = useState<MasterSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editPattern, setEditPattern] = useState(settings.cycle.pattern);
  const [editAnchorDate, setEditAnchorDate] = useState(settings.cycle.anchor_date || '');
  const [editAnchorDay, setEditAnchorDay] = useState(settings.cycle.anchor_cycle_day);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.masterSettings.get();
      if (response?.settings) {
        // Deep merge to handle null/undefined nested objects
        const merged: MasterSettings = {
          cycle: {
            ...defaultSettings.cycle,
            ...(response.settings.cycle || {}),
            pattern: response.settings.cycle?.pattern || defaultSettings.cycle.pattern,
          },
          work: {
            ...defaultSettings.work,
            ...(response.settings.work || {}),
          },
          constraints: response.settings.constraints || defaultSettings.constraints,
          commitments: response.settings.commitments || defaultSettings.commitments,
          leave_blocks: response.settings.leave_blocks || defaultSettings.leave_blocks,
        };
        setSettings(merged);
      } else {
        // No settings yet - use defaults
        setSettings(defaultSettings);
      }
    } catch (err: any) {
      console.error('Settings fetch error:', err);
      // 404 means no settings yet - use defaults
      if (err.status === 404 || err.message?.includes('404') || err.message?.includes('not found')) {
        setSettings(defaultSettings);
      } else {
        setError(err.message || 'Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: MasterSettings) => {
    try {
      setSaving(true);
      setError(null);
      await api.masterSettings.update(newSettings);
      setSettings(newSettings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
      setEditingSection(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCycle = () => {
    const newSettings = {
      ...settings,
      cycle: {
        pattern: editPattern,
        anchor_date: editAnchorDate || null,
        anchor_cycle_day: editAnchorDay,
      },
    };
    saveSettings(newSettings);
  };

  const handleRegenerateCalendar = async () => {
    if (!confirm('This will regenerate your entire calendar. Continue?')) return;
    try {
      setSaving(true);
      await api.calendar.regenerate(new Date().getFullYear());
      setSuccess('Calendar regenerated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate calendar');
    } finally {
      setSaving(false);
    }
  };

  const totalCycleDays = settings.cycle.pattern.reduce((sum, b) => sum + b.duration, 0);

  const blockConfig = {
    work_day: { icon: Sun, color: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30', label: 'Day Shift', bg: 'bg-amber-500' },
    work_night: { icon: Moon, color: 'from-indigo-500 to-purple-600', glow: 'shadow-indigo-500/30', label: 'Night Shift', bg: 'bg-indigo-500' },
    off: { icon: Coffee, color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30', label: 'Off Days', bg: 'bg-emerald-500' },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-watchman-accent border-t-transparent mb-4"
        />
        <p className="text-watchman-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center shadow-lg shadow-watchman-accent/30">
              <Settings className="w-6 h-6 text-white" />
            </div>
            Master Settings
          </h1>
          <p className="text-watchman-muted mt-1">
            Your single source of truth for all calendar rules
          </p>
        </div>

        <Button
          variant="glass"
          onClick={handleRegenerateCalendar}
          disabled={saving}
          className="gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerate Calendar
        </Button>
      </motion.div>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-4 rounded-2xl glass border border-red-500/30 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-400 flex-1">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-4 rounded-2xl glass border border-emerald-500/30 flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-emerald-400">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cycle Section - Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-3xl border border-white/10 overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-watchman-accent/10 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center shadow-lg shadow-watchman-accent/30">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Work Rotation Cycle</h2>
                <p className="text-sm text-watchman-muted">
                  {totalCycleDays} days total cycle length
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditPattern([...settings.cycle.pattern]);
                setEditAnchorDate(settings.cycle.anchor_date || '');
                setEditAnchorDay(settings.cycle.anchor_cycle_day);
                setEditingSection('cycle');
              }}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Pattern Visualization */}
          <div className="flex flex-wrap gap-3 mb-6">
            {settings.cycle.pattern.map((block, idx) => {
              const config = blockConfig[block.label];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-3 px-5 py-3 glass rounded-2xl border border-white/5 cursor-default group"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform group-hover:scale-110',
                    config.color,
                    config.glow
                  )}>
                    <config.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{block.duration} days</p>
                    <p className="text-xs text-watchman-muted">{config.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Cycle Timeline */}
          <div className="flex h-3 rounded-full overflow-hidden mb-6">
            {settings.cycle.pattern.map((block, idx) => {
              const config = blockConfig[block.label];
              const width = (block.duration / totalCycleDays) * 100;
              return (
                <motion.div
                  key={idx}
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
                  className={cn('h-full', config.bg)}
                />
              );
            })}
          </div>

          {/* Anchor Info */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl">
              <Sparkles className="w-4 h-4 text-watchman-accent" />
              <span className="text-watchman-muted">Anchor:</span>
              <span className="font-medium">
                {settings.cycle.anchor_date 
                  ? format(new Date(settings.cycle.anchor_date), 'MMM d, yyyy')
                  : 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl">
              <Target className="w-4 h-4 text-watchman-purple" />
              <span className="text-watchman-muted">Day</span>
              <span className="font-bold text-watchman-accent">{settings.cycle.anchor_cycle_day}</span>
              <span className="text-watchman-muted">of cycle</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grid of Settings Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Constraints Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl border border-white/10 p-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Constraints</h2>
              <p className="text-sm text-watchman-muted">Rules that protect your schedule</p>
            </div>
          </div>

          {settings.constraints.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-watchman-muted/30" />
              </div>
              <p className="text-watchman-muted mb-2">No constraints yet</p>
              <p className="text-xs text-watchman-muted/60">
                Try: &ldquo;Don&apos;t schedule study on night shifts&rdquo;
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {settings.constraints.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="p-4 rounded-xl glass border border-white/5 flex items-center justify-between group cursor-default"
                >
                  <div>
                    <p className="font-medium group-hover:text-watchman-accent transition-colors">{c.name}</p>
                    <p className="text-xs text-watchman-muted font-mono">{c.rule}</p>
                  </div>
                  <span className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium',
                    c.type === 'binary' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  )}>
                    {c.type}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Commitments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-3xl border border-white/10 p-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Commitments</h2>
              <p className="text-sm text-watchman-muted">Courses and recurring events</p>
            </div>
          </div>

          {settings.commitments.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-watchman-muted/30" />
              </div>
              <p className="text-watchman-muted mb-2">No commitments yet</p>
              <p className="text-xs text-watchman-muted/60">
                Try: &ldquo;I&apos;m studying for my MBA from Jan to June&rdquo;
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {settings.commitments.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="p-4 rounded-xl glass border border-white/5 flex items-center justify-between group cursor-default"
                >
                  <div>
                    <p className="font-medium group-hover:text-watchman-accent transition-colors">{c.name}</p>
                    <p className="text-xs text-watchman-muted capitalize">{c.type}</p>
                  </div>
                  {c.start_date && c.end_date && (
                    <span className="text-xs text-watchman-muted">
                      {format(new Date(c.start_date), 'MMM d')} - {format(new Date(c.end_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Leave Blocks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-3xl border border-white/10 p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Leave Blocks</h2>
            <p className="text-sm text-watchman-muted">Scheduled time off and holidays</p>
          </div>
        </div>

        {settings.leave_blocks.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-watchman-muted/30" />
            </div>
            <p className="text-watchman-muted mb-2">No leave scheduled</p>
            <p className="text-xs text-watchman-muted/60">
              Try: &ldquo;I&apos;m on vacation from Dec 25 to Jan 2&rdquo;
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {settings.leave_blocks.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 cursor-default"
              >
                <p className="font-medium text-teal-400">{l.name}</p>
                <p className="text-sm text-watchman-muted mt-1">
                  {format(new Date(l.start_date), 'MMM d')} - {format(new Date(l.end_date), 'MMM d, yyyy')}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Cycle Edit Modal */}
      <AnimatePresence>
        {editingSection === 'cycle' && (
          <Modal isOpen onClose={() => setEditingSection(null)} title="Edit Work Rotation">
            <div className="space-y-6">
              {/* Pattern Editor */}
              <div>
                <label className="block text-sm font-medium mb-3">Pattern Blocks</label>
                <div className="space-y-2">
                  {editPattern.map((block, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2"
                    >
                      <select
                        value={block.label}
                        onChange={(e) => {
                          const updated = [...editPattern];
                          updated[index] = { ...updated[index], label: e.target.value as 'work_day' | 'work_night' | 'off' };
                          setEditPattern(updated);
                        }}
                        className="flex-1 px-4 py-3 glass border border-white/10 rounded-xl focus:border-watchman-accent focus:outline-none"
                      >
                        <option value="work_day">Day Shift</option>
                        <option value="work_night">Night Shift</option>
                        <option value="off">Off Days</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={block.duration}
                        onChange={(e) => {
                          const updated = [...editPattern];
                          updated[index] = { ...updated[index], duration: Math.max(1, parseInt(e.target.value) || 1) };
                          setEditPattern(updated);
                        }}
                        className="w-24 px-4 py-3 glass border border-white/10 rounded-xl focus:border-watchman-accent focus:outline-none text-center"
                      />
                      <span className="text-sm text-watchman-muted w-12">days</span>
                      {editPattern.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditPattern(editPattern.filter((_, i) => i !== index))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditPattern([...editPattern, { label: 'off', duration: 5 }])}
                  className="mt-3 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Block
                </Button>
                <div className="mt-3 p-3 glass rounded-xl">
                  <span className="text-sm text-watchman-muted">Total cycle: </span>
                  <span className="font-bold text-watchman-accent">
                    {editPattern.reduce((s, b) => s + b.duration, 0)} days
                  </span>
                </div>
              </div>

              {/* Anchor Settings */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Anchor Date"
                  type="date"
                  value={editAnchorDate}
                  onChange={(e) => setEditAnchorDate(e.target.value)}
                />
                <Input
                  label="Cycle Day on Anchor"
                  type="number"
                  min="1"
                  max={editPattern.reduce((s, b) => s + b.duration, 0)}
                  value={editAnchorDay}
                  onChange={(e) => setEditAnchorDay(parseInt(e.target.value) || 1)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
                <Button variant="gradient" onClick={handleSaveCycle} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
