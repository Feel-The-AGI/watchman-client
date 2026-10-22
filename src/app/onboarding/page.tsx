'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowRight,
  Clock,
  Calendar,
  Sun,
  Moon,
  Coffee,
  CheckCircle,
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
import { LoadingState } from '@/components/ui/LoadingState';
import { api } from '@/lib/api';
import { chatMessageText } from '@/lib/chat-display';
import { copyRulesIntoSettings, createdCycleIdAfterChoiceChange, rulesStillNeeded, saveOnboardingCycle } from '@/lib/onboarding-setup';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { dashboardHandoffButton } from '@/lib/onboarding-handoff';
import {
  buildMonthPreview,
  parseLocalDate,
  anchorFromChatResponse,
  parseRotation,
  ROTATION_PRESETS,
  rotationFromChatResponse,
  rotationParsePrompt,
  workTypeForCycleDay,
  type CycleBlock,
  type ParsedRotation,
} from '@/lib/rotation';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  typing?: boolean;
}

const PRESET_CONSTRAINTS = [
  { name: 'No study on night shifts', rule: 'no_study_on:work_night', icon: Moon },
  { name: 'Max 2 commitments per day', rule: 'max_concurrent_commitments:2', icon: Target },
  { name: 'Study only on off days', rule: 'study_only_on:off', icon: Coffee },
  { name: 'No study on work days', rule: 'no_study_on:work_day', icon: Sun },
];

// POST /api/settings/constraints requires rule to be an object, matching ConstraintRequest.
function constraintRule(encoded: string): { type: string; value: string | number } {
  const splitAt = encoded.indexOf(':');
  const type = splitAt === -1 ? encoded : encoded.slice(0, splitAt);
  const raw = splitAt === -1 ? '' : encoded.slice(splitAt + 1);
  return { type, value: /^-?\d+$/.test(raw) ? Number(raw) : raw };
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Setup state
  const [cycleName] = useState('My Rotation');
  const [pattern, setPattern] = useState<CycleBlock[]>([]);
  const [anchorDate, setAnchorDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [anchorCycleDay, setAnchorCycleDay] = useState(1);
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const createdCycleIdRef = useRef<string | null>(null);
  const setupChoiceRef = useRef({
    pattern,
    anchor_date: anchorDate,
    anchor_cycle_day: anchorCycleDay,
  });
  const finishingRef = useRef(false);

  useEffect(() => {
    const next = {
      pattern,
      anchor_date: anchorDate,
      anchor_cycle_day: anchorCycleDay,
    };
    createdCycleIdRef.current = createdCycleIdAfterChoiceChange(
      createdCycleIdRef.current,
      setupChoiceRef.current,
      next,
    );
    setupChoiceRef.current = next;
  }, [pattern, anchorDate, anchorCycleDay]);

  const totalDays = pattern.reduce((sum, block) => sum + block.duration, 0);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      addMessage('assistant', "Hey! I'm your Watchman assistant. Let's set up your rotation in under 2 minutes.\n\nPick a rotation below, or type your own — for example, \"14 on, 14 off\" or \"5 days, 5 nights, 5 off\".");
    }, 300);
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

  const handleSelectCycle = (preset: typeof ROTATION_PRESETS[0]) => {
    addMessage('user', `I work ${preset.name}`);
    setPattern(preset.pattern);
    setShowQuickActions(false);
    
    setTimeout(() => {
      addMessage('assistant', `Perfect! ${preset.name} - ${preset.description}. Now I need to anchor your calendar. What date do you know your schedule for? And which day of the ${preset.pattern.reduce((s, b) => s + b.duration, 0)}-day cycle is it?`);
      setStep(2);
      setTimeout(() => setShowQuickActions(true), 500);
    }, 600);
  };

  const advanceToRules = (date: string, cycleDay: number) => {
    setAnchorDate(date);
    setAnchorCycleDay(cycleDay);
    setShowQuickActions(false);
    setTimeout(() => {
      addMessage('assistant', 'Great! Finally, set hard rules for your rotation, like no study on night shifts.');
      setStep(3);
      setTimeout(() => setShowQuickActions(true), 500);
    }, 600);
  };

  const handleSetAnchor = () => {
    const anchor = parseLocalDate(anchorDate) || new Date();
    addMessage('user', `${format(anchor, 'MMM d, yyyy')} is day ${anchorCycleDay} of my cycle`);
    advanceToRules(anchorDate, anchorCycleDay);
  };

  const toggleConstraint = (rule: string) => {
    if (selectedConstraints.includes(rule)) {
      setSelectedConstraints(selectedConstraints.filter(r => r !== rule));
    } else {
      setSelectedConstraints([...selectedConstraints, rule]);
    }
  };

  const handleComplete = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
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

      // Rules first. Cycle creation is the one calendar write, and it reads
      // constraints that already exist. Night-shift rules use { type, value }.
      const existingRules = await api.settings.getConstraints();
      const wanted = selectedConstraints.flatMap((rule) => {
        const preset = PRESET_CONSTRAINTS.find(p => p.rule === rule);
        if (!preset) return [];
        return [{ name: preset.name, rule: constraintRule(preset.rule) }];
      });
      for (const preset of rulesStillNeeded(wanted, existingRules)) {
        await api.settings.createConstraint({
          name: preset.name,
          rule: preset.rule,
          is_active: true,
        });
      }

      await saveOnboardingCycle({
        listCycles: () => api.cycles.list(),
        createCycle: () => api.cycles.create({
          name: cycleName,
          pattern,
          anchor_date: anchorDate,
          anchor_cycle_day: anchorCycleDay,
        }),
        completeOnboarding: () => api.auth.completeOnboarding(),
        choice: {
          pattern,
          anchor_date: anchorDate,
          anchor_cycle_day: anchorCycleDay,
        },
        createdCycleId: createdCycleIdRef.current,
        onCycleSaved: (cycleId) => {
          if (cycleId) createdCycleIdRef.current = cycleId;
        },
      });

      await copyRulesIntoSettings(async () => {
        const saved = await api.settings.getConstraints();
        const master = await api.masterSettings.get();
        const documentRules = Array.isArray(master?.settings?.constraints) ? master.settings.constraints : [];
        const known = new Set(documentRules.map((item: { id?: string }) => item?.id).filter(Boolean));
        const missing = (Array.isArray(saved) ? saved : []).filter(
          (row: { id?: string }) => row?.id && !known.has(row.id)
        );
        if (missing.length > 0) {
          await api.masterSettings.updateSection('constraints', [...documentRules, ...missing]);
        }
      });

      await refreshProfile();

      setTimeout(() => {
        addMessage('assistant', "All done! Your calendar is ready. Welcome to Watchman! 🎉");
        setStep(4);
      }, 1000);
    } catch (err: any) {
      setShowQuickActions(true);
      const friendly = chatMessageText(err?.message) || 'Failed to complete setup';
      setError(friendly);
      addMessage('assistant', friendly);
    } finally {
      finishingRef.current = false;
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const userMessage = inputValue;
    addMessage('user', userMessage);
    setInputValue('');
    setShowQuickActions(false);

    if (step === 1) {
      const acceptRotation = (parsed: ParsedRotation) => {
        setPattern(parsed.pattern);
        addMessage('assistant', `Got it! ${parsed.description} (${parsed.totalDays}-day cycle). Pick a date you know, and which day of that cycle it is. The preview updates as you change the anchor.`);
        setStep(2);
        setShowQuickActions(true);
      };

      const parsed = parseRotation(userMessage);
      if (parsed) {
        acceptRotation(parsed);
        return;
      }

      try {
        setLoading(true);
        const response = await api.chat.sendMessage(rotationParsePrompt(userMessage), false, pattern);
        const fromChat = rotationFromChatResponse(response);
        const chosen = fromChat?.understood ? fromChat.pattern : pattern;
        if (fromChat?.understood) setPattern(fromChat.pattern);
        const anchor = anchorFromChatResponse(response, chosen);
        if (anchor) {
          advanceToRules(anchor.date, anchor.cycle_day);
          return;
        }
        if (fromChat?.understood) {
          acceptRotation(fromChat);
        } else if (fromChat) {
          addMessage('assistant', fromChat.message);
          setShowQuickActions(true);
        } else {
          const reply = chatMessageText(
            response && typeof response === 'object'
              ? (response as { response?: unknown; message?: unknown }).response
                ?? (response as { message?: unknown }).message
              : response,
          );
          addMessage('assistant', reply || "Could you describe your shift pattern? For example: '5 days, 5 nights, 5 off' or '14 on, 14 off'");
          setShowQuickActions(true);
        }
      } catch {
        addMessage('assistant', "I couldn't process that right now. Try selecting from the presets below or describe your pattern like: '14 on, 14 off'.");
        setShowQuickActions(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Later steps stay in the same chat. The server does not apply changes from here.
    try {
      setLoading(true);
      const response = await api.chat.sendMessage(userMessage, false, step < 4 ? pattern : undefined);
      const anchor = anchorFromChatResponse(response, pattern);
      if (anchor) {
        advanceToRules(anchor.date, anchor.cycle_day);
        return;
      }
      const reply = chatMessageText(response?.response ?? response?.message);
      addMessage('assistant', reply || "I couldn't use that reply. Try the options below.");
      setTimeout(() => setShowQuickActions(true), 500);
    } catch (err: any) {
      addMessage('assistant', "I couldn't process that right now. Try using the options above.");
      setTimeout(() => setShowQuickActions(true), 500);
    } finally {
      setLoading(false);
    }
  };

  const monthPreview = pattern.length > 0 ? buildMonthPreview(pattern, anchorDate, anchorCycleDay) : null;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-watchman-bg flex items-center justify-center px-6">
        <LoadingState title="Loading Watchman…" detail="Checking your account before setup." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-watchman-bg text-white flex flex-col overflow-hidden">
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
      <main className="relative z-10 flex-1 min-h-0 flex max-w-6xl mx-auto w-full">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col min-h-0 max-w-2xl mx-auto w-full p-6">
          {/* Messages and presets scroll together so the buttons sit under the intro. */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-4">
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
                    <p className="text-sm leading-relaxed">{message.role === 'assistant' || typeof message.content !== 'string'
                      ? (chatMessageText(message.content) ?? '')
                      : message.content}</p>
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

          {/* Quick Actions stay in the scroll area, directly under the intro. */}
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
                  {ROTATION_PRESETS.map((preset, i) => (
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
                      Pick a date you know for sure (e.g., today) and tell us which day of your rotation cycle it is. The calendar is generated ahead from your rotation.
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
                  {monthPreview && (
                    <div className="lg:hidden pt-2">
                      <MonthPreview preview={monthPreview} anchorDate={anchorDate} anchorCycleDay={anchorCycleDay} />
                    </div>
                  )}
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
              <div className="pb-4">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-watchman-accent via-watchman-purple to-watchman-pink"
                  style={{ pointerEvents: dashboardHandoffButton().pointerEvents }}
                  onClick={() => router.push('/dashboard')}
                >
                  <Zap className="w-5 h-5" />
                  {dashboardHandoffButton().label}
                </button>
              </div>
            )}
          </AnimatePresence>
          </div>

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
        {monthPreview && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block w-80 p-6 border-l border-white/5 overflow-y-auto"
          >
            <div className="sticky top-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-watchman-muted">
                <Calendar className="w-4 h-4" />
                <span>Calendar Preview</span>
              </div>
              
              <div className="glass rounded-2xl p-4 border border-white/10">
                <MonthPreview preview={monthPreview} anchorDate={anchorDate} anchorCycleDay={anchorCycleDay} />
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

function CycleDayPreview({ cycleDay, pattern }: { cycleDay: number; pattern: CycleBlock[] }) {
  const blockType = workTypeForCycleDay(pattern, cycleDay);

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

function MonthPreview({
  preview,
  anchorDate,
  anchorCycleDay,
}: {
  preview: NonNullable<ReturnType<typeof buildMonthPreview>>
  anchorDate: string
  anchorCycleDay: number
}) {
  const anchor = parseLocalDate(anchorDate);
  const anchorIso = anchor
    ? `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}-${String(anchor.getDate()).padStart(2, '0')}`
    : null;

  return (
    <div data-testid="calendar-preview">
      <p className="text-xs text-watchman-muted mb-1">{preview.label}</p>
      <p className="text-[11px] text-watchman-muted mb-3">
        {anchor ? format(anchor, 'MMM d, yyyy') : anchorDate} is cycle day {anchorCycleDay}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
          <div key={`${label}-${index}`} className="text-[10px] text-center text-watchman-muted/50">{label}</div>
        ))}
        {preview.cells.map((cell) => (
          <div
            key={cell.key}
            data-testid={cell.iso ? `preview-${cell.iso}` : undefined}
            data-work-type={cell.workType ?? undefined}
            className={cn(
              'aspect-square rounded-md flex items-center justify-center',
              cell.iso === anchorIso && 'ring-1 ring-cyan-300',
              cell.workType === 'work_day' && 'bg-amber-500/40',
              cell.workType === 'work_night' && 'bg-indigo-500/40',
              cell.workType === 'off' && 'bg-emerald-500/40',
            )}
          >
            <span className="text-[10px]">{cell.day ?? ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
