'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
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
  
  // Edit states
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
        setSettings({ ...defaultSettings, ...response.settings });
      }
    } catch (err: any) {
      // If no master settings exist yet, use defaults
      if (err.message?.includes('404') || err.message?.includes('not found')) {
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
    work_day: { icon: Sun, color: 'bg-amber-500', label: 'Day Shift' },
    work_night: { icon: Moon, color: 'bg-indigo-500', label: 'Night Shift' },
    off: { icon: Coffee, color: 'bg-emerald-500', label: 'Off Days' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-watchman-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Settings className="w-7 h-7 text-watchman-accent" />
            Master Settings
          </h1>
          <p className="text-watchman-muted mt-1">
            Your single source of truth - all calendar rules in one place
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleRegenerateCalendar}
          disabled={saving}
          className="gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerate Calendar
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
        >
          <Check className="w-5 h-5 text-emerald-400" />
          <p className="text-sm text-emerald-400">{success}</p>
        </motion.div>
      )}

      {/* Cycle Section */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-watchman-accent/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-watchman-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Work Rotation Cycle</h2>
                <p className="text-sm text-watchman-muted">
                  {totalCycleDays} days total
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
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Pattern Visualization */}
          <div className="flex flex-wrap gap-3 mb-6">
            {settings.cycle.pattern.map((block, idx) => {
              const config = blockConfig[block.label];
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-watchman-bg border border-white/5"
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.color)}>
                    <config.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{block.duration} days</p>
                    <p className="text-xs text-watchman-muted">{config.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Anchor Info */}
          <div className="flex items-center gap-6 text-sm text-watchman-muted">
            <span>
              Anchor: {settings.cycle.anchor_date 
                ? format(new Date(settings.cycle.anchor_date), 'MMM d, yyyy')
                : 'Not set'}
            </span>
            <span>Day {settings.cycle.anchor_cycle_day} of cycle</span>
          </div>
        </CardContent>
      </Card>

      {/* Constraints Section */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Constraints</h2>
                <p className="text-sm text-watchman-muted">
                  Rules that protect your schedule
                </p>
              </div>
            </div>
          </div>

          {settings.constraints.length === 0 ? (
            <div className="text-center py-8 text-watchman-muted">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No constraints yet. Add them via chat!</p>
              <p className="text-xs mt-1">Try: &quot;Don&apos;t schedule study on night shifts&quot;</p>
            </div>
          ) : (
            <div className="space-y-2">
              {settings.constraints.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-watchman-bg border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-watchman-muted">{c.rule}</p>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs',
                    c.type === 'binary' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  )}>
                    {c.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commitments Section */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Commitments</h2>
                <p className="text-sm text-watchman-muted">
                  Courses, diplomas, and recurring events
                </p>
              </div>
            </div>
          </div>

          {settings.commitments.length === 0 ? (
            <div className="text-center py-8 text-watchman-muted">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No commitments yet. Add them via chat!</p>
              <p className="text-xs mt-1">Try: &quot;I&apos;m studying for my MBA from Jan to June&quot;</p>
            </div>
          ) : (
            <div className="space-y-2">
              {settings.commitments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-watchman-bg border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-watchman-muted">{c.type}</p>
                  </div>
                  {c.start_date && c.end_date && (
                    <span className="text-xs text-watchman-muted">
                      {format(new Date(c.start_date), 'MMM d')} - {format(new Date(c.end_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Blocks Section */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Plane className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Leave Blocks</h2>
                <p className="text-sm text-watchman-muted">
                  Scheduled time off and holidays
                </p>
              </div>
            </div>
          </div>

          {settings.leave_blocks.length === 0 ? (
            <div className="text-center py-8 text-watchman-muted">
              <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No leave scheduled. Add via chat!</p>
              <p className="text-xs mt-1">Try: &quot;I&apos;m on vacation from Dec 25 to Jan 2&quot;</p>
            </div>
          ) : (
            <div className="space-y-2">
              {settings.leave_blocks.map((l) => (
                <div key={l.id} className="p-3 rounded-lg bg-watchman-bg border border-white/5 flex items-center justify-between">
                  <p className="font-medium">{l.name}</p>
                  <span className="text-xs text-watchman-muted">
                    {format(new Date(l.start_date), 'MMM d')} - {format(new Date(l.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cycle Edit Modal */}
      {editingSection === 'cycle' && (
        <Modal isOpen onClose={() => setEditingSection(null)} title="Edit Work Rotation">
          <div className="space-y-4">
            {/* Pattern Editor */}
            <div>
              <label className="block text-sm font-medium mb-2">Pattern Blocks</label>
              <div className="space-y-2">
                {editPattern.map((block, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={block.label}
                      onChange={(e) => {
                        const updated = [...editPattern];
                        updated[index] = { ...updated[index], label: e.target.value as any };
                        setEditPattern(updated);
                      }}
                      className="flex-1 px-3 py-2 bg-watchman-bg border border-white/10 rounded-lg focus:border-watchman-accent focus:outline-none"
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
                      className="w-20 px-3 py-2 bg-watchman-bg border border-white/10 rounded-lg focus:border-watchman-accent focus:outline-none"
                    />
                    <span className="text-sm text-watchman-muted">days</span>
                    {editPattern.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditPattern(editPattern.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditPattern([...editPattern, { label: 'off', duration: 5 }])}
                className="mt-2 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Block
              </Button>
              <p className="text-xs text-watchman-muted mt-2">
                Total: {editPattern.reduce((s, b) => s + b.duration, 0)} days
              </p>
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
              <Button variant="primary" onClick={handleSaveCycle} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
