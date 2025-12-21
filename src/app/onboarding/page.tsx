'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  Calendar,
  Sun,
  Moon,
  Coffee,
  CheckCircle,
  Plus,
  X,
  Loader2,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CycleBlock {
  label: 'work_day' | 'work_night' | 'off';
  duration: number;
}

interface Constraint {
  name: string;
  rule: string;
  type: 'binary';
}

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'cycle', title: 'Define Rotation' },
  { id: 'anchor', title: 'Set Anchor' },
  { id: 'constraints', title: 'Set Rules' },
  { id: 'complete', title: 'Complete' },
];

const PRESET_CYCLES = [
  {
    name: 'Mining Standard',
    description: '10 days, 5 nights, 10 off',
    pattern: [
      { label: 'work_day' as const, duration: 10 },
      { label: 'work_night' as const, duration: 5 },
      { label: 'off' as const, duration: 10 },
    ],
  },
  {
    name: '2 Week Rotation',
    description: '7 on, 7 off',
    pattern: [
      { label: 'work_day' as const, duration: 7 },
      { label: 'off' as const, duration: 7 },
    ],
  },
  {
    name: '4x4 Shift',
    description: '4 days, 4 off',
    pattern: [
      { label: 'work_day' as const, duration: 4 },
      { label: 'off' as const, duration: 4 },
    ],
  },
  {
    name: 'Custom',
    description: 'Build your own',
    pattern: [],
  },
];

const PRESET_CONSTRAINTS = [
  { name: 'No study on night shifts', rule: 'no_study_on:work_night' },
  { name: 'Max 2 commitments', rule: 'max_concurrent_commitments:2' },
  { name: 'Study only on off days', rule: 'study_only_on:off' },
  { name: 'No study on work days', rule: 'no_study_on:work_day' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cycle state
  const [cycleName, setCycleName] = useState('My Rotation');
  const [pattern, setPattern] = useState<CycleBlock[]>([
    { label: 'work_day', duration: 10 },
    { label: 'work_night', duration: 5 },
    { label: 'off', duration: 10 },
  ]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>('Mining Standard');

  // Anchor state
  const [anchorDate, setAnchorDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [anchorCycleDay, setAnchorCycleDay] = useState(1);

  // Constraints state
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([
    'no_study_on:work_night',
    'max_concurrent_commitments:2',
  ]);

  const totalDays = pattern.reduce((sum, block) => sum + block.duration, 0);

  const handlePresetSelect = (preset: typeof PRESET_CYCLES[0]) => {
    setSelectedPreset(preset.name);
    if (preset.pattern.length > 0) {
      setPattern(preset.pattern);
    }
  };

  const handleAddBlock = () => {
    setPattern([...pattern, { label: 'off', duration: 1 }]);
    setSelectedPreset('Custom');
  };

  const handleRemoveBlock = (index: number) => {
    setPattern(pattern.filter((_, i) => i !== index));
    setSelectedPreset('Custom');
  };

  const handleUpdateBlock = (index: number, field: 'label' | 'duration', value: any) => {
    const updated = [...pattern];
    updated[index] = { 
      ...updated[index], 
      [field]: field === 'duration' ? Math.max(1, parseInt(value) || 1) : value 
    };
    setPattern(updated);
    setSelectedPreset('Custom');
  };

  const toggleConstraint = (rule: string) => {
    if (selectedConstraints.includes(rule)) {
      setSelectedConstraints(selectedConstraints.filter(r => r !== rule));
    } else {
      setSelectedConstraints([...selectedConstraints, rule]);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create cycle
      await api.cycles.create({
        name: cycleName,
        pattern,
        anchor_date: anchorDate,
        anchor_cycle_day: anchorCycleDay,
        total_days: totalDays,
        is_active: true,
      });

      // Create constraints
      for (const rule of selectedConstraints) {
        const preset = PRESET_CONSTRAINTS.find(p => p.rule === rule);
        if (preset) {
          await api.settings.createConstraint({
            name: preset.name,
            rule: preset.rule,
            type: 'binary',
            is_active: true,
          });
        }
      }

      // Generate calendar
      const currentYear = new Date().getFullYear();
      await api.calendar.regenerate(currentYear);

      // Move to complete step
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return pattern.length > 0 && totalDays > 0;
      case 2: return anchorDate && anchorCycleDay >= 1 && anchorCycleDay <= totalDays;
      case 3: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep === 3) {
      handleComplete();
    } else {
      setCurrentStep(Math.min(currentStep + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(Math.max(currentStep - 1, 0));
  };

  return (
    <div className="min-h-screen bg-watchman-bg text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="md" />
            <span className="text-xl font-semibold">Watchman</span>
          </div>
          
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.slice(1, -1).map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    currentStep > index + 1
                      ? 'bg-watchman-mint text-white'
                      : currentStep === index + 1
                      ? 'bg-watchman-accent text-white'
                      : 'bg-white/10 text-watchman-muted'
                  )}
                >
                  {currentStep > index + 1 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div
                    className={cn(
                      'w-12 h-0.5 mx-1',
                      currentStep > index + 1 ? 'bg-watchman-mint' : 'bg-white/10'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {currentStep === 0 && (
              <StepContainer key="welcome">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-watchman-accent/10 border border-watchman-accent/20 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-watchman-accent" />
                  </div>
                  <h1 className="text-3xl font-bold mb-4">Welcome to Watchman</h1>
                  <p className="text-watchman-muted mb-8 max-w-md mx-auto">
                    Let&apos;s set up your rotation schedule. This will take about 2 minutes.
                    You can always change these settings later.
                  </p>
                  <Button variant="primary" size="lg" onClick={handleNext} className="gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </StepContainer>
            )}

            {/* Step 1: Define Cycle */}
            {currentStep === 1 && (
              <StepContainer key="cycle">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-watchman-accent/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-watchman-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Define Your Rotation</h2>
                    <p className="text-watchman-muted">How does your work schedule repeat?</p>
                  </div>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {PRESET_CYCLES.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        'p-4 rounded-xl border text-left transition-colors',
                        selectedPreset === preset.name
                          ? 'bg-watchman-accent/10 border-watchman-accent/30'
                          : 'bg-watchman-surface border-white/5 hover:border-white/10'
                      )}
                    >
                      <p className="font-medium">{preset.name}</p>
                      <p className="text-sm text-watchman-muted">{preset.description}</p>
                    </button>
                  ))}
                </div>

                {/* Pattern Builder */}
                <Card>
                  <CardContent className="py-4">
                    <label className="block text-sm font-medium mb-3">Pattern Blocks</label>
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
                            min="1"
                            value={block.duration}
                            onChange={(e) => handleUpdateBlock(index, 'duration', e.target.value)}
                            className="w-20 px-3 py-2 bg-watchman-bg border border-white/10 rounded-lg focus:border-watchman-accent focus:outline-none text-center"
                          />
                          <span className="text-sm text-watchman-muted w-12">days</span>
                          {pattern.length > 1 && (
                            <button
                              onClick={() => handleRemoveBlock(index)}
                              className="p-2 text-watchman-muted hover:text-watchman-error transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAddBlock}
                      className="flex items-center gap-2 mt-3 text-sm text-watchman-accent hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Add Block
                    </button>
                    <div className="mt-4 p-3 bg-watchman-bg rounded-lg">
                      <p className="text-sm">
                        <span className="text-watchman-muted">Total cycle length: </span>
                        <span className="font-semibold">{totalDays} days</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </StepContainer>
            )}

            {/* Step 2: Set Anchor */}
            {currentStep === 2 && (
              <StepContainer key="anchor">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-watchman-accent/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-watchman-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Set Your Anchor</h2>
                    <p className="text-watchman-muted">When does your rotation start?</p>
                  </div>
                </div>

                <Card>
                  <CardContent className="py-6 space-y-6">
                    <div>
                      <p className="text-watchman-muted mb-4">
                        Pick any date you know your schedule for, and tell us which day 
                        of the {totalDays}-day cycle it falls on.
                      </p>
                    </div>

                    <Input
                      label="Anchor Date"
                      type="date"
                      value={anchorDate}
                      onChange={(e) => setAnchorDate(e.target.value)}
                      helper="Choose a date you know your schedule for"
                    />

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        What day of the cycle is {format(new Date(anchorDate), 'MMM d, yyyy')}?
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max={totalDays}
                          value={anchorCycleDay}
                          onChange={(e) => setAnchorCycleDay(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <div className="w-20 text-center">
                          <span className="text-2xl font-bold text-watchman-accent">
                            {anchorCycleDay}
                          </span>
                          <span className="text-watchman-muted text-sm"> / {totalDays}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cycle Day Preview */}
                    <div className="p-4 bg-watchman-bg rounded-xl">
                      <p className="text-sm text-watchman-muted mb-2">On this day you are:</p>
                      <CycleDayPreview 
                        cycleDay={anchorCycleDay} 
                        pattern={pattern} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </StepContainer>
            )}

            {/* Step 3: Constraints */}
            {currentStep === 3 && (
              <StepContainer key="constraints">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-watchman-error/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-watchman-error" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Set Your Rules</h2>
                    <p className="text-watchman-muted">What boundaries should the system respect?</p>
                  </div>
                </div>

                <Card>
                  <CardContent className="py-6">
                    <p className="text-watchman-muted mb-4">
                      These are hard rules that will never be broken. Select the ones that apply to you.
                    </p>

                    <div className="space-y-3">
                      {PRESET_CONSTRAINTS.map((constraint) => (
                        <button
                          key={constraint.rule}
                          onClick={() => toggleConstraint(constraint.rule)}
                          className={cn(
                            'w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-colors',
                            selectedConstraints.includes(constraint.rule)
                              ? 'bg-watchman-error/10 border-watchman-error/30'
                              : 'bg-watchman-surface border-white/5 hover:border-white/10'
                          )}
                        >
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                              selectedConstraints.includes(constraint.rule)
                                ? 'border-watchman-error bg-watchman-error'
                                : 'border-white/20'
                            )}
                          >
                            {selectedConstraints.includes(constraint.rule) && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{constraint.name}</p>
                            <p className="text-sm text-watchman-muted">{constraint.rule}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <p className="text-sm text-watchman-muted mt-4">
                      You can add more constraints later in Settings.
                    </p>
                  </CardContent>
                </Card>

                {error && (
                  <div className="mt-4 p-4 rounded-xl bg-watchman-error/10 border border-watchman-error/20">
                    <p className="text-sm text-watchman-error">{error}</p>
                  </div>
                )}
              </StepContainer>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <StepContainer key="complete">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="w-20 h-20 rounded-full bg-watchman-mint/10 border border-watchman-mint/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-10 h-10 text-watchman-mint" />
                  </motion.div>
                  <h1 className="text-3xl font-bold mb-4">You&apos;re All Set!</h1>
                  <p className="text-watchman-muted mb-8 max-w-md mx-auto">
                    Your calendar has been generated. You can now view your schedule,
                    add commitments, and propose changes.
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => router.push('/dashboard')}
                    className="gap-2"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </StepContainer>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {currentStep > 0 && currentStep < 4 && (
            <div className="flex items-center justify-between mt-8">
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    Complete Setup
                    <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Step Container with animation
function StepContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// Cycle Day Preview Component
function CycleDayPreview({ cycleDay, pattern }: { cycleDay: number; pattern: CycleBlock[] }) {
  let currentDay = 0;
  let blockType: 'work_day' | 'work_night' | 'off' = 'off';

  for (const block of pattern) {
    if (cycleDay <= currentDay + block.duration) {
      blockType = block.label;
      break;
    }
    currentDay += block.duration;
  }

  const config = {
    work_day: { icon: Sun, label: 'Day Shift', color: 'text-work-day', bg: 'bg-work-day' },
    work_night: { icon: Moon, label: 'Night Shift', color: 'text-work-night', bg: 'bg-work-night' },
    off: { icon: Coffee, label: 'Off Day', color: 'text-work-off', bg: 'bg-work-off' },
  };

  const blockConfig = config[blockType];

  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', blockConfig.bg)}>
        <blockConfig.icon className="w-5 h-5 text-white" />
      </div>
      <span className={cn('font-medium', blockConfig.color)}>{blockConfig.label}</span>
    </div>
  );
}
