'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
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
  Send,
  Bot,
  User,
  Zap,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CycleBlock {
  label: 'work_day' | 'work_night' | 'off';
  duration: number;
}

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  typing?: boolean;
}

const PRESET_CYCLES = [
  {
    name: '10 On / 5 Off',
    description: '10 straight days working, 5 days off',
    pattern: [
      { label: 'work_day' as const, duration: 10 },
      { label: 'off' as const, duration: 5 },
    ],
  },
  {
    name: '5/5/5 Rotation',
    description: '5 days, 5 nights, 5 off',
    pattern: [
      { label: 'work_day' as const, duration: 5 },
      { label: 'work_night' as const, duration: 5 },
      { label: 'off' as const, duration: 5 },
    ],
  },
  {
    name: 'Weekdays',
    description: 'Monday to Friday (standard work week)',
    pattern: [
      { label: 'work_day' as const, duration: 5 },
      { label: 'off' as const, duration: 2 },
    ],
  },
  {
    name: '5 On / 5 Off',
    description: '5 days working, 5 days off',
    pattern: [
      { label: 'work_day' as const, duration: 5 },
      { label: 'off' as const, duration: 5 },
    ],
  },
];

// Parse natural language shift descriptions into pattern
function parseShiftDescription(text: string): CycleBlock[] | null {
  const lowered = text.toLowerCase();

  // Common patterns to detect
  // "5 days, 5 nights, 5 off" or "5 day 5 night 5 off"
  const dayNightOffMatch = lowered.match(/(\d+)\s*(?:days?|day\s*shifts?)\s*[,\s]+(\d+)\s*(?:nights?|night\s*shifts?)\s*[,\s]+(\d+)\s*(?:off|rest|days?\s*off)/i);
  if (dayNightOffMatch) {
    return [
      { label: 'work_day', duration: parseInt(dayNightOffMatch[1]) },
      { label: 'work_night', duration: parseInt(dayNightOffMatch[2]) },
      { label: 'off', duration: parseInt(dayNightOffMatch[3]) },
    ];
  }

  // "5/5/5" pattern (days/nights/off)
  const slashPattern = lowered.match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
  if (slashPattern) {
    return [
      { label: 'work_day', duration: parseInt(slashPattern[1]) },
      { label: 'work_night', duration: parseInt(slashPattern[2]) },
      { label: 'off', duration: parseInt(slashPattern[3]) },
    ];
  }

  // "X on Y off" pattern
  const onOffMatch = lowered.match(/(\d+)\s*(?:on|days?)\s*[,\s]+(\d+)\s*(?:off|rest)/i);
  if (onOffMatch) {
    return [
      { label: 'work_day', duration: parseInt(onOffMatch[1]) },
      { label: 'off', duration: parseInt(onOffMatch[2]) },
    ];
  }

  // "X days then Y nights then Z off"
  const thenPattern = lowered.match(/(\d+)\s*(?:days?|day\s*shifts?)\s*then\s*(\d+)\s*(?:nights?|night\s*shifts?)\s*then\s*(\d+)\s*(?:off|rest)/i);
  if (thenPattern) {
    return [
      { label: 'work_day', duration: parseInt(thenPattern[1]) },
      { label: 'work_night', duration: parseInt(thenPattern[2]) },
      { label: 'off', duration: parseInt(thenPattern[3]) },
    ];
  }

  return null;
}

const PRESET_CONSTRAINTS = [
  { name: 'No study on night shifts', rule: 'no_study_on:work_night', icon: Moon },
  { name: 'Max 2 commitments per day', rule: 'max_concurrent_commitments:2', icon: Target },
  { name: 'Study only on off days', rule: 'study_only_on:off', icon: Coffee },
  { name: 'No study on work days', rule: 'no_study_on:work_day', icon: Sun },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Setup state
  const [cycleName] = useState('My Rotation');
  const [pattern, setPattern] = useState<CycleBlock[]>([]);
  const [anchorDate, setAnchorDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [anchorCycleDay, setAnchorCycleDay] = useState(1);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);

  const totalDays = pattern.reduce((sum, block) => sum + block.duration, 0);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const timer = setTimeout(() => {
      addMessage('assistant', "Hey! I'm your Watchman assistant. Let's set up your rotation schedule in under 2 minutes.\n\nYou can either select a preset below, or just type your schedule naturally - something like \"5 days, 5 nights, 5 off\" or \"10 on 5 off\".");
      setStep(1);
      setTimeout(() => setShowQuickActions(true), 500);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const addMessage = (role: 'assistant' | 'user', content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    }]);
  };

  const handleSelectCycle = (preset: typeof PRESET_CYCLES[0]) => {
    addMessage('user', `I work ${preset.name}`);
    setPattern(preset.pattern);
    setShowQuickActions(false);
    
    setTimeout(() => {
      addMessage('assistant', `Perfect! ${preset.name} - ${preset.description}. Now I need to anchor your calendar. What date do you know your schedule for? And which day of the ${preset.pattern.reduce((s, b) => s + b.duration, 0)}-day cycle is it?`);
      setStep(2);
      setTimeout(() => setShowQuickActions(true), 500);
    }, 600);
  };

  const handleSetAnchor = () => {
    addMessage('user', `${format(new Date(anchorDate), 'MMM d, yyyy')} is day ${anchorCycleDay} of my cycle`);
    setShowQuickActions(false);
    
    setTimeout(() => {
      addMessage('assistant', "Great! Finally, what rules should I always respect? These are hard constraints that will never be broken.");
      setStep(3);
      setTimeout(() => setShowQuickActions(true), 500);
    }, 600);
  };

  const toggleConstraint = (rule: string) => {
    if (selectedConstraints.includes(rule)) {
      setSelectedConstraints(selectedConstraints.filter(r => r !== rule));
    } else {
      setSelectedConstraints([...selectedConstraints, rule]);
    }
  };

  const handleComplete = async () => {
    if (selectedConstraints.length > 0) {
      addMessage('user', `Apply these rules: ${selectedConstraints.map(r => PRESET_CONSTRAINTS.find(c => c.rule === r)?.name).join(', ')}`);
    } else {
      addMessage('user', "No specific rules needed");
    }
    setShowQuickActions(false);

    setTimeout(() => {
      addMessage('assistant', "Perfect! Setting up your calendar now...");
    }, 400);

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

      setTimeout(() => {
        addMessage('assistant', "All done! Your calendar is ready. Welcome to Watchman! 🎉");
        setStep(4);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
      addMessage('assistant', `Oops, something went wrong: ${err.message}. Let's try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const userMessage = inputValue;
    addMessage('user', userMessage);
    setInputValue('');
    setShowQuickActions(false);

    // If we're in step 1 (rotation selection), try to parse the shift description
    if (step === 1) {
      const parsedPattern = parseShiftDescription(userMessage);

      if (parsedPattern) {
        setPattern(parsedPattern);
        const totalDays = parsedPattern.reduce((s, b) => s + b.duration, 0);
        const patternDescription = parsedPattern.map(p => {
          if (p.label === 'work_day') return `${p.duration} day shift${p.duration > 1 ? 's' : ''}`;
          if (p.label === 'work_night') return `${p.duration} night shift${p.duration > 1 ? 's' : ''}`;
          return `${p.duration} day${p.duration > 1 ? 's' : ''} off`;
        }).join(', ');

        setTimeout(() => {
          addMessage('assistant', `Got it! I understood your rotation as: ${patternDescription} (${totalDays}-day cycle). Now I need to anchor your calendar. Pick a date you know for sure, and tell me which day of the ${totalDays}-day cycle it is.`);
          setStep(2);
          setTimeout(() => setShowQuickActions(true), 500);
        }, 600);
        return;
      } else {
        // Couldn't parse, send to AI for help
        try {
          setLoading(true);
          const response = await api.chat.sendMessage(`Help me understand this shift pattern: "${userMessage}". Respond with a simple explanation of what pattern you understood, or ask clarifying questions if unclear. Keep response brief.`);
          if (response?.response || response?.message) {
            addMessage('assistant', (response.response || response.message) + "\n\nTry describing your schedule like: \"5 days, 5 nights, 5 off\" or \"10 on, 5 off\" - or select from the options above.");
          }
          setTimeout(() => setShowQuickActions(true), 500);
        } catch (err: any) {
          addMessage('assistant', "I couldn't understand that pattern. Try describing it like: \"5 days, 5 nights, 5 off\" or \"10 on, 5 off\" - or select from the options above.");
          setTimeout(() => setShowQuickActions(true), 500);
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    // For other steps, send to Gemini via backend
    try {
      setLoading(true);
      const response = await api.chat.sendMessage(userMessage);
      if (response?.response) {
        addMessage('assistant', response.response);
      } else if (response?.message) {
        addMessage('assistant', response.message);
      }
      setTimeout(() => setShowQuickActions(true), 500);
    } catch (err: any) {
      addMessage('assistant', "I couldn't process that right now. Try using the options above.");
      setTimeout(() => setShowQuickActions(true), 500);
    } finally {
      setLoading(false);
    }
  };

  // Preview calendar generation
  const previewDays = pattern.length > 0 ? generatePreviewDays(pattern, anchorDate, anchorCycleDay) : [];

  return (
    <div className="min-h-screen bg-watchman-bg text-white flex flex-col">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-watchman-accent/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-watchman-purple/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4 glass-strong border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-xl font-bold tracking-tight">Watchman</span>
          </div>
          
          {/* Progress Dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <motion.div
                key={s}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: s * 0.1 }}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all duration-300',
                  step >= s 
                    ? 'bg-watchman-accent shadow-lg shadow-watchman-accent/50' 
                    : 'bg-white/20'
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex max-w-6xl mx-auto w-full">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-6">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
                    message.role === 'assistant' 
                      ? 'bg-gradient-to-br from-watchman-accent to-watchman-purple shadow-lg shadow-watchman-accent/30' 
                      : 'bg-white/10'
                  )}>
                    {message.role === 'assistant' ? (
                      <Bot className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className={cn(
                    'max-w-[80%] px-5 py-3 rounded-2xl',
                    message.role === 'assistant' 
                      ? 'glass border border-white/10' 
                      : 'bg-watchman-accent text-white'
                  )}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading Indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-watchman-accent to-watchman-purple flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="glass px-5 py-4 rounded-2xl border border-white/10">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-watchman-accent rounded-full"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <AnimatePresence>
            {showQuickActions && step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-3 pb-4"
              >
                <p className="text-xs text-watchman-muted uppercase tracking-wider px-1">Select your rotation</p>
                <div className="grid gap-2">
                  {PRESET_CYCLES.map((preset, i) => (
                    <motion.button
                      key={preset.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectCycle(preset)}
                      className="flex items-center gap-4 p-4 glass rounded-2xl border border-white/5 hover:border-watchman-accent/30 transition-all group text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-watchman-accent/20 to-watchman-purple/20 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-watchman-accent/20 transition-shadow">
                        <Clock className="w-6 h-6 text-watchman-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold group-hover:text-watchman-accent transition-colors">{preset.name}</p>
                        <p className="text-sm text-watchman-muted">{preset.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-watchman-muted group-hover:text-watchman-accent transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {showQuickActions && step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-4 pb-4"
              >
                <div className="glass rounded-2xl p-5 border border-white/10 space-y-4">
                  <div className="p-3 mb-2 bg-watchman-accent/10 rounded-xl border border-watchman-accent/20">
                    <p className="text-xs text-watchman-accent flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      <strong>What is anchoring?</strong>
                    </p>
                    <p className="text-xs text-watchman-muted mt-1">
                      Pick a date you know for sure (e.g., today) and tell us which day of your rotation cycle it is. This lets us calculate your entire year.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-watchman-muted uppercase tracking-wider mb-2">Anchor Date</label>
                    <input
                      type="date"
                      value={anchorDate}
                      onChange={(e) => setAnchorDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-watchman-accent focus:outline-none focus:ring-2 focus:ring-watchman-accent/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-watchman-muted uppercase tracking-wider mb-2">
                      Which day of the cycle? ({anchorCycleDay} of {totalDays})
                    </label>
                    <input
                      type="range"
                      min="1"
                      max={totalDays}
                      value={anchorCycleDay}
                      onChange={(e) => setAnchorCycleDay(parseInt(e.target.value))}
                      className="w-full accent-watchman-accent"
                    />
                    <div className="flex justify-between text-xs text-watchman-muted mt-1">
                      <span>Day 1</span>
                      <span className="text-watchman-accent font-bold text-lg">{anchorCycleDay}</span>
                      <span>Day {totalDays}</span>
                    </div>
                  </div>
                  <CycleDayPreview cycleDay={anchorCycleDay} pattern={pattern} />
                </div>
                <Button variant="gradient" className="w-full gap-2" onClick={handleSetAnchor}>
                  <Calendar className="w-4 h-4" />
                  Set Anchor
                </Button>
              </motion.div>
            )}

            {showQuickActions && step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-4 pb-4"
              >
                <div className="space-y-2">
                  {PRESET_CONSTRAINTS.map((constraint, i) => (
                    <motion.button
                      key={constraint.rule}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => toggleConstraint(constraint.rule)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left',
                        selectedConstraints.includes(constraint.rule)
                          ? 'glass-strong border-watchman-accent/50 shadow-lg shadow-watchman-accent/10'
                          : 'glass border-white/5 hover:border-white/10'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                        selectedConstraints.includes(constraint.rule)
                          ? 'bg-watchman-accent shadow-lg shadow-watchman-accent/30'
                          : 'bg-white/5'
                      )}>
                        <constraint.icon className={cn(
                          'w-5 h-5',
                          selectedConstraints.includes(constraint.rule) ? 'text-white' : 'text-watchman-muted'
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{constraint.name}</p>
                      </div>
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                        selectedConstraints.includes(constraint.rule)
                          ? 'border-watchman-accent bg-watchman-accent'
                          : 'border-white/20'
                      )}>
                        {selectedConstraints.includes(constraint.rule) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
                <Button 
                  variant="gradient" 
                  className="w-full gap-2" 
                  onClick={handleComplete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pb-4"
              >
                <Button 
                  variant="gradient" 
                  size="lg"
                  className="w-full gap-2" 
                  onClick={() => router.push('/dashboard')}
                >
                  <Zap className="w-5 h-5" />
                  Go to Dashboard
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="glass rounded-2xl border border-white/10 p-2 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-transparent border-none focus:outline-none text-sm"
            />
            <Button variant="ghost" size="sm" onClick={handleSendMessage} className="px-3">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Preview Panel - Desktop Only */}
        {pattern.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block w-80 p-6 border-l border-white/5"
          >
            <div className="sticky top-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-watchman-muted">
                <Calendar className="w-4 h-4" />
                <span>Calendar Preview</span>
              </div>
              
              <div className="glass rounded-2xl p-4 border border-white/10">
                <p className="text-xs text-watchman-muted mb-3">{format(new Date(), 'MMMM yyyy')}</p>
                <div className="grid grid-cols-7 gap-1">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-[10px] text-center text-watchman-muted/50">{d}</div>
                  ))}
                  {previewDays.slice(0, 35).map((day, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn(
                        'aspect-square rounded-md flex items-center justify-center',
                        day.workType === 'work_day' && 'bg-amber-500/30',
                        day.workType === 'work_night' && 'bg-indigo-500/30',
                        day.workType === 'off' && 'bg-emerald-500/30',
                      )}
                    >
                      <span className="text-[10px]">{day.date}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-amber-500" />
                  <span className="text-watchman-muted">Day Shift</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-indigo-500" />
                  <span className="text-watchman-muted">Night Shift</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-watchman-muted">Off Day</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass-strong px-6 py-4 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
    work_day: { icon: Sun, label: 'Day Shift', color: 'text-amber-400', bg: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    work_night: { icon: Moon, label: 'Night Shift', color: 'text-indigo-400', bg: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
    off: { icon: Coffee, label: 'Off Day', color: 'text-emerald-400', bg: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
  };

  const blockConfig = config[blockType];

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-lg', blockConfig.bg)}>
        <blockConfig.icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-watchman-muted">On this day you are</p>
        <p className={cn('font-semibold', blockConfig.color)}>{blockConfig.label}</p>
      </div>
    </div>
  );
}

// Generate preview days
function generatePreviewDays(pattern: CycleBlock[], anchorDate: string, anchorCycleDay: number) {
  const days: { date: number; workType: 'work_day' | 'work_night' | 'off' }[] = [];
  const startDate = new Date();
  startDate.setDate(1); // Start of month
  
  const totalCycleDays = pattern.reduce((s, b) => s + b.duration, 0);
  
  for (let i = 0; i < 35; i++) {
    const date = addDays(startDate, i);
    const dayOfMonth = date.getDate();
    
    // Calculate cycle day for this date
    const anchor = new Date(anchorDate);
    const diff = Math.floor((date.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
    let cycleDay = ((anchorCycleDay - 1 + diff) % totalCycleDays + totalCycleDays) % totalCycleDays + 1;
    
    // Find work type for this cycle day
    let currentDay = 0;
    let workType: 'work_day' | 'work_night' | 'off' = 'off';
    for (const block of pattern) {
      if (cycleDay <= currentDay + block.duration) {
        workType = block.label;
        break;
      }
      currentDay += block.duration;
    }
    
    days.push({ date: dayOfMonth, workType });
  }
  
  return days;
}
