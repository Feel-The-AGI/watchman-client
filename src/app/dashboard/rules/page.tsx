'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  AlertCircle,
  Clock,
  Calendar,
  Sun,
  Moon,
  Coffee,
  Lock,
  RefreshCw,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CycleBlock {
  label: 'work_day' | 'work_night' | 'off';
  duration: number;
}

interface Cycle {
  id: string;
  name: string;
  pattern: CycleBlock[];
  anchor_date: string;
  anchor_cycle_day: number;
  total_days: number;
  is_active: boolean;
}

interface Constraint {
  id: string;
  name: string;
  type: 'binary' | 'weighted';
  rule: string;
  weight?: number;
  is_active: boolean;
}

export default function RulesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weightedMode, setWeightedMode] = useState(false);

  // Modal states
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showConstraintModal, setShowConstraintModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [editingConstraint, setEditingConstraint] = useState<Constraint | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [cyclesRes, constraintsRes, settingsRes] = await Promise.all([
        api.cycles.list(),
        api.settings.getConstraints(),
        api.settings.get(),
      ]);
      
      setCycles(cyclesRes || []);
      setConstraints(constraintsRes || []);
      setWeightedMode(settingsRes?.settings?.weighted_mode_enabled || false);
    } catch (err: any) {
      setError(err.message || 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCycle = async (cycleData: Partial<Cycle>) => {
    try {
      setActionLoading(true);
      if (editingCycle) {
        await api.cycles.update(editingCycle.id, cycleData);
      } else {
        await api.cycles.create(cycleData);
      }
      setShowCycleModal(false);
      setEditingCycle(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save cycle');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCycle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cycle?')) return;
    
    try {
      await api.cycles.delete(id);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete cycle');
    }
  };

  const handleSaveConstraint = async (constraintData: Partial<Constraint>) => {
    try {
      setActionLoading(true);
      if (editingConstraint) {
        await api.settings.updateConstraint(editingConstraint.id, constraintData);
      } else {
        await api.settings.createConstraint(constraintData);
      }
      setShowConstraintModal(false);
      setEditingConstraint(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save constraint');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConstraint = async (id: string) => {
    if (!confirm('Are you sure you want to delete this constraint?')) return;
    
    try {
      await api.settings.deleteConstraint(id);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete constraint');
    }
  };

  const handleToggleWeightedMode = async () => {
    try {
      const newValue = !weightedMode;
      await api.settings.update({ weighted_mode: newValue });
      setWeightedMode(newValue);
    } catch (err: any) {
      setError(err.message || 'Failed to update setting');
    }
  };

  const handleRegenerateCalendar = async () => {
    if (!confirm('This will regenerate your entire calendar based on current rules. Continue?')) return;
    
    try {
      setRegenerating(true);
      await api.calendar.regenerate(new Date().getFullYear());
      // Success toast would go here
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate calendar');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rules & Constraints</h1>
          <p className="text-watchman-muted">
            Define your rotation cycles and constraints
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={handleRegenerateCalendar}
          disabled={regenerating}
          className="gap-2"
        >
          {regenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Regenerate Calendar
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-watchman-error/10 border border-watchman-error/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-watchman-error flex-shrink-0" />
          <p className="text-sm text-watchman-error">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            Dismiss
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-watchman-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* Cycles Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-watchman-accent/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-watchman-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Rotation Cycles</h2>
                  <p className="text-sm text-watchman-muted">
                    Your work rotation patterns
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingCycle(null);
                  setShowCycleModal(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Cycle
              </Button>
            </div>

            {cycles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-watchman-muted opacity-50" />
                  <p className="text-watchman-muted mb-4">
                    No rotation cycles defined yet.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowCycleModal(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Cycle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {cycles.map((cycle) => (
                  <CycleCard
                    key={cycle.id}
                    cycle={cycle}
                    onEdit={() => {
                      setEditingCycle(cycle);
                      setShowCycleModal(true);
                    }}
                    onDelete={() => handleDeleteCycle(cycle.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Constraints Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-watchman-error/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-watchman-error" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Constraints</h2>
                  <p className="text-sm text-watchman-muted">
                    Rules that protect your schedule
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingConstraint(null);
                  setShowConstraintModal(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Constraint
              </Button>
            </div>

            {constraints.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-watchman-muted opacity-50" />
                  <p className="text-watchman-muted mb-4">
                    No constraints defined yet.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowConstraintModal(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Constraint
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {constraints.map((constraint) => (
                  <ConstraintCard
                    key={constraint.id}
                    constraint={constraint}
                    showWeight={weightedMode}
                    onEdit={() => {
                      setEditingConstraint(constraint);
                      setShowConstraintModal(true);
                    }}
                    onDelete={() => handleDeleteConstraint(constraint.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Weighted Mode Toggle */}
          <section>
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-watchman-mint/10 flex items-center justify-center">
                      <Sliders className="w-5 h-5 text-watchman-mint" />
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        Weighted Mode
                        <span className="px-2 py-0.5 rounded text-xs bg-watchman-muted/20 text-watchman-muted">
                          Advanced
                        </span>
                      </h3>
                      <p className="text-sm text-watchman-muted">
                        Enable weighted constraints for flexible scheduling suggestions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleWeightedMode}
                    className={cn(
                      'relative w-14 h-8 rounded-full transition-colors',
                      weightedMode ? 'bg-watchman-mint' : 'bg-white/10'
                    )}
                  >
                    <motion.div
                      animate={{ x: weightedMode ? 24 : 4 }}
                      className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
                    />
                  </button>
                </div>

                {weightedMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-watchman-bg rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-watchman-muted flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-watchman-muted">
                        <p className="mb-2">
                          <strong className="text-white">How weighted mode works:</strong>
                        </p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Binary constraints still take priority and never break</li>
                          <li>Weighted constraints add preferences (e.g., &quot;prefer mornings&quot;)</li>
                          <li>Proposals will be ranked by total weight score</li>
                          <li>You still approve everything manually</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* Cycle Modal */}
      <AnimatePresence>
        {showCycleModal && (
          <CycleModal
            cycle={editingCycle}
            onSave={handleSaveCycle}
            onClose={() => {
              setShowCycleModal(false);
              setEditingCycle(null);
            }}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      {/* Constraint Modal */}
      <AnimatePresence>
        {showConstraintModal && (
          <ConstraintModal
            constraint={editingConstraint}
            showWeight={weightedMode}
            onSave={handleSaveConstraint}
            onClose={() => {
              setShowConstraintModal(false);
              setEditingConstraint(null);
            }}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Cycle Card Component
interface CycleCardProps {
  cycle: Cycle;
  onEdit: () => void;
  onDelete: () => void;
}

function CycleCard({ cycle, onEdit, onDelete }: CycleCardProps) {
  const blockIcons = {
    work_day: { icon: Sun, color: 'bg-work-day', label: 'Day' },
    work_night: { icon: Moon, color: 'bg-work-night', label: 'Night' },
    off: { icon: Coffee, color: 'bg-work-off', label: 'Off' },
  };

  return (
    <Card className={cycle.is_active ? 'border-watchman-accent/30' : ''}>
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{cycle.name}</h3>
              {cycle.is_active && (
                <span className="px-2 py-0.5 rounded-full bg-watchman-accent/20 text-watchman-accent text-xs">
                  Active
                </span>
              )}
            </div>

            {/* Pattern Visualization */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {cycle.pattern.map((block, index) => {
                const config = blockIcons[block.label];
                return (
                  <div key={index} className="flex items-center gap-1">
                    <div className={cn('w-5 h-5 rounded flex items-center justify-center', config.color)}>
                      <config.icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-watchman-muted">
                      {block.duration} {config.label}
                    </span>
                    {index < cycle.pattern.length - 1 && (
                      <span className="text-watchman-muted mx-1">→</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-watchman-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Anchor: {format(new Date(cycle.anchor_date), 'MMM d, yyyy')}
              </span>
              <span>Day {cycle.anchor_cycle_day} of {cycle.total_days}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-watchman-error">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Constraint Card Component
interface ConstraintCardProps {
  constraint: Constraint;
  showWeight: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ConstraintCard({ constraint, showWeight, onEdit, onDelete }: ConstraintCardProps) {
  return (
    <div className={cn(
      'p-4 rounded-xl border transition-colors',
      constraint.is_active
        ? 'bg-watchman-surface border-white/10'
        : 'bg-watchman-surface/50 border-white/5 opacity-60'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{constraint.name}</h4>
            <span className={cn(
              'px-2 py-0.5 rounded text-xs',
              constraint.type === 'binary'
                ? 'bg-watchman-error/20 text-watchman-error'
                : 'bg-watchman-mint/20 text-watchman-mint'
            )}>
              {constraint.type}
            </span>
          </div>
          <p className="text-sm text-watchman-muted">{constraint.rule}</p>
          {showWeight && constraint.type === 'weighted' && constraint.weight && (
            <p className="text-xs text-watchman-muted mt-1">
              Weight: {constraint.weight > 0 ? '+' : ''}{constraint.weight}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-watchman-error">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Cycle Modal Component
interface CycleModalProps {
  cycle: Cycle | null;
  onSave: (data: Partial<Cycle>) => void;
  onClose: () => void;
  loading: boolean;
}

function CycleModal({ cycle, onSave, onClose, loading }: CycleModalProps) {
  const [name, setName] = useState(cycle?.name || '');
  const [anchorDate, setAnchorDate] = useState(cycle?.anchor_date || format(new Date(), 'yyyy-MM-dd'));
  const [anchorCycleDay, setAnchorCycleDay] = useState(cycle?.anchor_cycle_day || 1);
  const [pattern, setPattern] = useState<CycleBlock[]>(
    cycle?.pattern || [
      { label: 'work_day', duration: 10 },
      { label: 'work_night', duration: 5 },
      { label: 'off', duration: 10 },
    ]
  );

  const totalDays = pattern.reduce((sum, block) => sum + block.duration, 0);

  const handleAddBlock = () => {
    setPattern([...pattern, { label: 'off', duration: 1 }]);
  };

  const handleRemoveBlock = (index: number) => {
    setPattern(pattern.filter((_, i) => i !== index));
  };

  const handleUpdateBlock = (index: number, field: 'label' | 'duration', value: any) => {
    const updated = [...pattern];
    updated[index] = { ...updated[index], [field]: field === 'duration' ? parseInt(value) || 1 : value };
    setPattern(updated);
  };

  const handleSubmit = () => {
    onSave({
      name,
      anchor_date: anchorDate,
      anchor_cycle_day: anchorCycleDay,
      pattern,
      total_days: totalDays,
      is_active: true,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={cycle ? 'Edit Cycle' : 'Create Cycle'}>
      <div className="space-y-4">
        <Input
          label="Cycle Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Mining Rotation"
        />

        {/* Pattern Builder */}
        <div>
          <label className="block text-sm font-medium mb-2">Pattern Blocks</label>
          <div className="space-y-2">
            {pattern.map((block, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={block.label}
                  onChange={(e) => handleUpdateBlock(index, 'label', e.target.value)}
                  className="flex-1 px-3 py-2 bg-watchman-bg border border-white/10 rounded-lg focus:border-watchman-accent focus:outline-none"
                >
                  <option value="work_day">Day Shift</option>
                  <option value="work_night">Night Shift</option>
                  <option value="off">Off</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={block.duration}
                  onChange={(e) => handleUpdateBlock(index, 'duration', e.target.value)}
                  className="w-20 px-3 py-2 bg-watchman-bg border border-white/10 rounded-lg focus:border-watchman-accent focus:outline-none"
                />
                <span className="text-sm text-watchman-muted">days</span>
                {pattern.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveBlock(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleAddBlock} className="mt-2 gap-2">
            <Plus className="w-4 h-4" />
            Add Block
          </Button>
          <p className="text-xs text-watchman-muted mt-2">
            Total cycle: {totalDays} days
          </p>
        </div>

        {/* Anchor Settings */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Anchor Date"
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
          />
          <Input
            label="Anchor Cycle Day"
            type="number"
            min="1"
            max={totalDays}
            value={anchorCycleDay}
            onChange={(e) => setAnchorCycleDay(parseInt(e.target.value) || 1)}
            helper={`Day of cycle on anchor date (1-${totalDays})`}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!name || loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {cycle ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Constraint Modal Component
interface ConstraintModalProps {
  constraint: Constraint | null;
  showWeight: boolean;
  onSave: (data: Partial<Constraint>) => void;
  onClose: () => void;
  loading: boolean;
}

function ConstraintModal({ constraint, showWeight, onSave, onClose, loading }: ConstraintModalProps) {
  const [name, setName] = useState(constraint?.name || '');
  const [type, setType] = useState<'binary' | 'weighted'>(constraint?.type || 'binary');
  const [rule, setRule] = useState(constraint?.rule || '');
  const [weight, setWeight] = useState(constraint?.weight || 0);

  const handleSubmit = () => {
    onSave({
      name,
      type,
      rule,
      weight: type === 'weighted' ? weight : undefined,
      is_active: true,
    });
  };

  const presetRules = [
    { label: 'No study on night shifts', value: 'no_study_on:work_night' },
    { label: 'No study on work days', value: 'no_study_on:work_day' },
    { label: 'Max 2 commitments at a time', value: 'max_concurrent_commitments:2' },
    { label: 'Study only on off days', value: 'study_only_on:off' },
  ];

  return (
    <Modal isOpen onClose={onClose} title={constraint ? 'Edit Constraint' : 'Add Constraint'}>
      <div className="space-y-4">
        <Input
          label="Constraint Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., No study on nights"
        />

        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType('binary')}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors',
                type === 'binary'
                  ? 'bg-watchman-error/10 border-watchman-error/30 text-watchman-error'
                  : 'border-white/10 text-watchman-muted hover:border-white/20'
              )}
            >
              Binary (Hard Rule)
            </button>
            {showWeight && (
              <button
                onClick={() => setType('weighted')}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors',
                  type === 'weighted'
                    ? 'bg-watchman-mint/10 border-watchman-mint/30 text-watchman-mint'
                    : 'border-white/10 text-watchman-muted hover:border-white/20'
                )}
              >
                Weighted (Preference)
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Rule</label>
          <select
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            className="w-full px-3 py-2 bg-watchman-bg border border-white/10 rounded-lg focus:border-watchman-accent focus:outline-none mb-2"
          >
            <option value="">Select a preset rule...</option>
            {presetRules.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <Input
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            placeholder="Or enter custom rule..."
          />
        </div>

        {type === 'weighted' && (
          <Input
            label="Weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
            helper="Positive = preferred, Negative = discouraged"
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!name || !rule || loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {constraint ? 'Update' : 'Add'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
